/**
 * @license
 * Copyright (c) 2025 Prime Inc
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


import React, { useRef, useEffect, useState } from 'react';
import { useScrollManager } from '../hooks/useScrollManager';
import type { StoryScrollerProps } from '../types';

export const StoryScroller: React.FC<StoryScrollerProps> = (props) => {
  const scrollManager = useScrollManager(props);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  
  // Track section changes for announcements
  useEffect(() => {
    if (!scrollManager.getState) return;
    
    const interval = setInterval(() => {
      const state = scrollManager.getState?.();
      if (state && state.currentSection !== currentSection) {
        const newSection = state.currentSection;
        setCurrentSection(newSection);
        
        // Announce section change to screen readers
        const sectionLabel = props.sectionLabels?.[newSection] || `Section ${newSection + 1}`;
        const totalSections = props.sections.length;
        setAnnouncement(`${sectionLabel}, section ${newSection + 1} of ${totalSections}`);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentSection, scrollManager.getState, props.sections.length, props.sectionLabels]);
  
  // Expose navigation functions globally for demo app access
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).storyScrollerAPI = {
        gotoSection: scrollManager.gotoSection,
        nextSection: scrollManager.nextSection,
        prevSection: scrollManager.prevSection,
        getState: scrollManager.getState,
        getQueueStatus: scrollManager.getQueueStatus,
        forceSync: scrollManager.forceSync,
        emergencyReset: scrollManager.emergencyReset
      };
    }
  }, [scrollManager.gotoSection, scrollManager.nextSection, scrollManager.prevSection, scrollManager.getState, scrollManager.getQueueStatus, scrollManager.forceSync, scrollManager.emergencyReset]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="story-scroller-live-region"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {announcement}
      </div>
      
      <div
        ref={scrollManager.containerRef}
        className={`story-scroller-container ${props.containerClassName || ''} ${props.className || ''}`.trim()}
        role="region"
        aria-label={props.ariaLabel || "Story sections"}
        aria-describedby="story-scroller-instructions"
        style={{
          width: '100vw',
          overscrollBehavior: 'none',
          ...props.style,
        }}
      >
        {/* Screen reader instructions */}
        <div id="story-scroller-instructions" className="sr-only">
          Use arrow keys, Page Up/Down, or scroll to navigate between sections. 
          There are {props.sections.length} sections total.
          {prefersReducedMotion && " Animations are disabled due to your motion preferences."}
        </div>
        
        {props.sections.map((child, i) => {
          const sectionLabel = props.sectionLabels?.[i] || `Section ${i + 1}`;
          const isActive = i === currentSection;
          
          return (
            <section
              key={i}
              data-section-idx={i}
              tabIndex={0}
              className={`story-scroller-section ${props.sectionClassName || ''}`.trim()}
              role="region"
              aria-label={`${sectionLabel}, section ${i + 1} of ${props.sections.length}`}
              aria-current={isActive ? "true" : undefined}
              style={{
                height: '100vh',
                width: '100%',
                outline: 'none',
              }}
            >
              {/* Section label for screen readers */}
              <h2 className="sr-only">
                {sectionLabel}
              </h2>
              
              {child}
            </section>
          );
        })}
      </div>
    </>
  );
};
