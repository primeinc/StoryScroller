
import React from 'react';
import { useScrollManager } from '../hooks/useScrollManager';
import type { StoryScrollerProps } from '../types';

export const StoryScroller: React.FC<StoryScrollerProps> = (props) => {
  const scrollManager = useScrollManager(props);
  
  // Expose navigation functions globally for demo app access
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).storyScrollerAPI = {
        gotoSection: scrollManager.gotoSection,
        nextSection: scrollManager.nextSection,
        prevSection: scrollManager.prevSection,
        getState: scrollManager.getState,
        forceSync: scrollManager.forceSync,
        emergencyReset: scrollManager.emergencyReset
      };
    }
  }, [scrollManager.gotoSection, scrollManager.nextSection, scrollManager.prevSection, scrollManager.getState, scrollManager.forceSync, scrollManager.emergencyReset]);

  return (
    <div
      ref={scrollManager.containerRef}
      className={`story-scroller-container ${props.containerClassName || ''} ${props.className || ''}`.trim()}
      style={{
        width: '100vw',
        overscrollBehavior: 'none',
        ...props.style,
      }}
    >
      {props.sections.map((child, i) => (
        <section
          key={i}
          data-section-idx={i}
          tabIndex={0}
          className={`story-scroller-section ${props.sectionClassName || ''}`.trim()}
          style={{
            height: '100vh',
            width: '100%',
            outline: 'none',
          }}
        >
          {child}
        </section>
      ))}
    </div>
  );
};
