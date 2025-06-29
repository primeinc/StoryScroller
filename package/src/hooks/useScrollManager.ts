/**
 * @fileoverview The centralized scroll management hook using the new state system.
 * This hook orchestrates Lenis, GSAP, and Observer with the new useScrollState
 * to create a stable and predictable scroll experience.
 */

import { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Observer } from 'gsap/Observer';
import type { 
  ScrollManagerAPI, 
  ScrollManagerConfig, 
  AnimationControllers,
  NavigationOptions,
  ScrollState
} from '../types/scroll-manager';
import { useScrollState } from './useScrollState';
import { createBrowserService } from '../services/BrowserService';
import { createAnimationQueue } from '../utils/animation-queue';
import { forceSync, emergencyReset } from '../utils/scroll-sync';
import { TIMING, PHYSICS, EASING_FUNCTIONS } from '../constants/scroll-physics';

// Register GSAP plugins once at module level
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer);

// Dynamic import for Lenis to prevent SSR issues
const initLenis = async () => {
  const Lenis = (await import('lenis')).default;
  const lenis = new Lenis({ 
    lerp: PHYSICS.LENIS_LERP, 
    wheelMultiplier: PHYSICS.LENIS_WHEEL_MULTIPLIER
  });
  
  // Add necessary classes to HTML element
  document.documentElement.classList.add('lenis');
  console.log('🔧 [initLenis] Added lenis class to html element');
  
  return lenis;
};

export function useScrollManager(config: ScrollManagerConfig): ScrollManagerAPI {
  const { 
    sections, 
    onSectionChange, 
    keyboardNavigation = true, 
    duration = PHYSICS.BASE_ANIMATION_DURATION, 
    easing = EASING_FUNCTIONS.CUBIC_OUT,
    tolerance = PHYSICS.OBSERVER_TOLERANCE,
    preventDefault = true,
    invertDirection = false,
    browserService: providedBrowserService
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const browserService = useRef(providedBrowserService || createBrowserService());
  const animationQueue = useRef(createAnimationQueue());
  const controllers = useRef<AnimationControllers>({ 
    lenis: null, 
    observer: null, 
    scrollTween: null, 
    rafId: null, 
    verificationIntervalId: null, 
    keyboardCleanup: null 
  });

  // Use the new scroll state management
  const scrollState = useScrollState({
    sections: sections.length,
    duration,
    onStateChange: (newState) => {
      // Call user's onSectionChange when section changes
      if (onSectionChange && newState.currentSection !== scrollState.getState().currentSection) {
        onSectionChange(newState.currentSection);
      }
    }
  });

  // Create a ref for the current state with all required fields
  const stateRef = useRef<ScrollState>({
    ...scrollState.getState(),
    lastNavigationTime: Date.now()
  });

  // Update stateRef whenever state changes
  useEffect(() => {
    stateRef.current = {
      ...scrollState.getState(),
      lastNavigationTime: stateRef.current.lastNavigationTime
    };
  }, [scrollState]);

  const processNavigationQueue = useCallback(async () => {
    if (animationQueue.current.processing || !scrollState.queries.canNavigate()) return;

    const request = animationQueue.current.dequeue();
    if (!request) return;

    animationQueue.current.processing = true;
    const targetY = request.targetSection * browserService.current.getInnerHeight();
    const animationDuration = request.options?.duration || duration;

    console.log('🚀 [processNavigationQueue] Processing navigation:', {
      target: request.targetSection,
      currentSection: scrollState.queries.getCurrentSection(),
      duration: animationDuration
    });

    // Update state to start animation
    scrollState.updateState({
      targetSection: request.targetSection,
      isAnimating: true,
      lastInputType: request.source as any
    });

    // Update last navigation time in ref
    stateRef.current.lastNavigationTime = Date.now();

    // Kill any existing scroll animations
    gsap.killTweensOf(window);
    
    // Create new scroll animation
    controllers.current.scrollTween = gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: animationDuration,
      ease: request.options?.easing || easing,
      onComplete: () => {
        console.log('✅ [processNavigationQueue] Animation complete');
        
        // Update state
        scrollState.updateState({
          currentSection: request.targetSection,
          targetSection: null,
          isAnimating: false,
          scrollPosition: targetY
        });

        // Call completion callback
        request.options?.onComplete?.();
        
        // Process next request
        animationQueue.current.processing = false;
        processNavigationQueue();
      },
      onInterrupt: () => {
        console.log('⚠️ [processNavigationQueue] Animation interrupted');
        scrollState.updateState({ isAnimating: false, targetSection: null });
        request.options?.onInterrupt?.();
        animationQueue.current.processing = false;
      }
    });
  }, [scrollState, duration, easing]);

  const gotoSection = useCallback((index: number, options?: NavigationOptions) => {
    const clampedIndex = Math.max(0, Math.min(sections.length - 1, index));
    
    console.log('🎯 [gotoSection] Request:', {
      requested: index,
      clamped: clampedIndex,
      current: scrollState.queries.getCurrentSection()
    });

    const request = animationQueue.current.enqueue({ 
      targetSection: clampedIndex, 
      source: 'programmatic', 
      priority: options?.force ? 'high' : 'normal', 
      options 
    });

    if (request) {
      processNavigationQueue();
    }
  }, [sections.length, scrollState, processNavigationQueue]);

  const nextSection = useCallback(() => {
    const current = scrollState.queries.getCurrentSection();
    if (current < sections.length - 1) {
      gotoSection(current + 1);
    }
  }, [gotoSection, scrollState, sections.length]);

  const prevSection = useCallback(() => {
    const current = scrollState.queries.getCurrentSection();
    if (current > 0) {
      gotoSection(current - 1);
    }
  }, [gotoSection, scrollState]);

  const setupInputHandlers = useCallback(() => {
    // Observer for wheel/touch input
    controllers.current.observer = Observer.create({
      target: containerRef.current,
      type: 'wheel,touch',
      tolerance,
      preventDefault,
      onChangeY: (self) => {
        if (!scrollState.queries.canNavigate()) return;

        const velocity = self.velocityY || 0;
        const delta = self.deltaY || 0;
        const direction = invertDirection ? -Math.sign(delta) : Math.sign(delta);

        // Update velocity in state
        scrollState.setters.setVelocity(Math.abs(velocity));

        // Determine if we should navigate
        if (Math.abs(delta) > tolerance) {
          const current = scrollState.queries.getCurrentSection();
          const target = current + direction;

          if (target >= 0 && target < sections.length) {
            const request = animationQueue.current.enqueue({
              targetSection: target,
              source: self.event?.type === 'wheel' ? 'user_wheel' : 'user_touch',
              priority: 'normal'
            });

            if (request) {
              processNavigationQueue();
            }
          }
        }
      }
    });

    // Keyboard navigation
    if (keyboardNavigation) {
      const handleKeydown = (e: KeyboardEvent) => {
        if (!scrollState.queries.canNavigate()) return;

        switch (e.key) {
          case 'ArrowDown':
          case 'PageDown':
            e.preventDefault();
            nextSection();
            break;
          case 'ArrowUp':
          case 'PageUp':
            e.preventDefault();
            prevSection();
            break;
          case 'Home':
            e.preventDefault();
            gotoSection(0);
            break;
          case 'End':
            e.preventDefault();
            gotoSection(sections.length - 1);
            break;
        }
      };

      window.addEventListener('keydown', handleKeydown);
      controllers.current.keyboardCleanup = () => window.removeEventListener('keydown', handleKeydown);
    }
  }, [
    scrollState,
    sections.length,
    tolerance,
    preventDefault,
    invertDirection,
    keyboardNavigation,
    nextSection,
    prevSection,
    gotoSection,
    processNavigationQueue
  ]);

  const setupScrollSync = useCallback(async () => {
    if (!controllers.current.lenis) return;

    // Configure ScrollTrigger to work with Lenis
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value?: number) {
        if (arguments.length && value !== undefined) {
          controllers.current.lenis!.scroll = value;
        }
        return controllers.current.lenis!.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      }
    });

    // Sync Lenis with GSAP ticker
    const ticker = (time: number) => {
      controllers.current.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    controllers.current.lenisTickerCallback = ticker;

    // Update ScrollTrigger on Lenis scroll
    controllers.current.lenis.on('scroll', ScrollTrigger.update);

    // Initial refresh
    ScrollTrigger.refresh();
  }, []);

  const reinitialize = useCallback(async () => {
    console.log('🔄 [reinitialize] Starting scroll system initialization');

    // Initialize Lenis
    controllers.current.lenis = await initLenis();
    controllers.current.lenis.stop(); // Start stopped

    // Setup sync between Lenis and ScrollTrigger
    await setupScrollSync();

    // Setup input handlers
    setupInputHandlers();

    // Start Lenis
    controllers.current.lenis.start();

    // Set up periodic state verification
    controllers.current.verificationIntervalId = setInterval(() => {
      scrollState.verifyState();
    }, TIMING.STATE_VERIFICATION_INTERVAL);

    console.log('✅ [reinitialize] Scroll system initialized');
  }, [setupScrollSync, setupInputHandlers, scrollState]);

  const destroy = useCallback(() => {
    console.log('🧹 [destroy] Cleaning up scroll system');

    // Kill all animations
    gsap.killTweensOf('*');
    
    // Clean up ScrollTrigger
    ScrollTrigger.killAll();
    
    // Clean up Observer
    controllers.current.observer?.kill();
    
    // Clean up Lenis
    if (controllers.current.lenis) {
      controllers.current.lenis.destroy();
      document.documentElement.classList.remove('lenis');
    }

    // Clean up GSAP ticker
    if (controllers.current.lenisTickerCallback) {
      gsap.ticker.remove(controllers.current.lenisTickerCallback);
    }

    // Clear intervals
    if (controllers.current.verificationIntervalId) {
      clearInterval(controllers.current.verificationIntervalId);
    }

    // Clean up keyboard
    if (controllers.current.keyboardCleanup) {
      controllers.current.keyboardCleanup();
    }

    // Clear animation queue
    animationQueue.current.clear();
  }, []);

  // Initialize on mount, cleanup on unmount
  useEffect(() => {
    reinitialize();
    return destroy;
  }, [reinitialize, destroy]);

  // Public API matching ScrollManagerAPI interface
  return {
    containerRef,
    gotoSection,
    nextSection,
    prevSection,
    forceSync: () => {
      const currentSection = Math.round(browserService.current.getScrollY() / browserService.current.getInnerHeight());
      forceSync(currentSection, stateRef, controllers.current, browserService.current, scrollState.updateState);
    },
    emergencyReset: () => {
      emergencyReset(controllers.current, reinitialize, scrollState.resetState);
    },
    destroy,
    // Optional methods for debugging
    getState: () => ({
      ...scrollState.getState(),
      lastNavigationTime: stateRef.current.lastNavigationTime
    }),
    getQueueStatus: () => ({
      pending: animationQueue.current.requests.length,
      processing: animationQueue.current.processing
    })
  };
}