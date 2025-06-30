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

/**
 * @fileoverview The centralized scroll management hook using the new state system.
 * This hook orchestrates Lenis, GSAP, and Observer with the new useScrollState
 * to create a stable and predictable scroll experience.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
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
import { useDebouncing } from './useDebouncing';
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

export function useScrollManager(initialConfig: ScrollManagerConfig): ScrollManagerAPI {
  
  // Make config state-based for dynamic updates
  const [currentConfig, setCurrentConfig] = useState<ScrollManagerConfig>(initialConfig);
  
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
  } = currentConfig;

  // Function to update configuration dynamically
  const updateConfig = useCallback((newConfig: Partial<ScrollManagerConfig>) => {
    console.log('🔧 [updateConfig] Updating configuration:', newConfig);
    
    setCurrentConfig(prev => {
      const updated = { ...prev, ...newConfig };
      console.log('🔧 [updateConfig] New config:', updated);
      return updated;
    });
    
    // If Observer settings change, we need to reinitialize it
    if (newConfig.tolerance !== undefined) {
      console.log('🔧 [updateConfig] Observer tolerance changed, will reinitialize on next effect');
    }
  }, []);

  // Check for reduced motion preference and adjust duration accordingly
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.current = mediaQuery.matches;
      
      const handler = (e: MediaQueryListEvent) => {
        prefersReducedMotion.current = e.matches;
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    
    // Return empty cleanup function for cases where window is undefined
    return () => {};
  }, []);

  // Adjust animation duration based on motion preference
  const getEffectiveDuration = useCallback(() => {
    return prefersReducedMotion.current ? 0.01 : duration;
  }, [duration]);

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

  // Initialize debouncing with optimized configuration for responsiveness
  const debouncing = useDebouncing({
    navigationCooldown: TIMING.NAVIGATION_COOLDOWN, // Now 100ms instead of 200ms
    animationDuration: getEffectiveDuration() * 1000, // Convert to milliseconds, respect reduced motion
    scrollEndDelay: TIMING.SCROLL_END_TIMEOUT,
    preventOverlap: false, // Allow overlapping for better button responsiveness
    trackMomentum: true,
    debug: true, // Enable debug logging to track issues
    logPrefix: '🎯 [ScrollManager]'
  });

  // Create a ref for the current state with all required fields
  const stateRef = useRef<ScrollState>({
    ...scrollState.getState(),
    lastNavigationTime: Date.now()
  });

  // Track current section in a ref for immediate access
  const currentSectionRef = useRef(scrollState.getState().currentSection);

  // Update stateRef whenever state changes
  useEffect(() => {
    const newState = scrollState.getState();
    stateRef.current = {
      ...newState,
      lastNavigationTime: stateRef.current.lastNavigationTime
    };
    currentSectionRef.current = newState.currentSection;
  }, [scrollState]);

  const processNavigationQueue = useCallback(async () => {
    // Check if we're already processing
    if (animationQueue.current.processing) return;
    
    // Peek at the next request to determine navigation rules
    const nextRequest = animationQueue.current.requests[0];
    if (!nextRequest) return;
    
    // For wheel events, use a more lenient navigation check that doesn't block on scrolling
    let canNavigateNow = false;
    if (nextRequest.source === 'user_wheel') {
      // For wheel events, only check animation state and cooldown, not scrolling
      const notAnimating = !debouncing.isAnimating();
      const cooldownMet = (Date.now() - (stateRef.current.lastNavigationTime || 0)) >= 100;
      canNavigateNow = notAnimating && cooldownMet;
      
    } else {
      // For other navigation types, use the full debouncing check
      canNavigateNow = debouncing.canNavigate();
    }
    
    if (!canNavigateNow) return;

    const request = animationQueue.current.dequeue();
    if (!request) return;

    animationQueue.current.processing = true;
    const targetY = request.targetSection * browserService.current.getInnerHeight();
    const animationDuration = request.options?.duration || getEffectiveDuration();
    const animationId = `section-${request.targetSection}-${Date.now()}`;

    console.log('🚀 [processNavigationQueue] Processing navigation:', {
      target: request.targetSection,
      currentSection: scrollState.queries.getCurrentSection(),
      duration: animationDuration,
      animationId,
      reducedMotion: prefersReducedMotion.current
    });

    // Mark animation start in debouncing
    debouncing.markAnimationStart(animationId);

    // Update state to start animation with immediate currentSection update for responsiveness
    scrollState.updateState({
      currentSection: request.targetSection, // Update immediately for responsive feedback
      targetSection: request.targetSection,
      isAnimating: true,
      lastInputType: request.source as any
    });

    // Update refs immediately for consistent state
    currentSectionRef.current = request.targetSection;
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
        
        // Mark animation end in debouncing
        debouncing.markAnimationEnd(animationId);
        
        // Update state
        console.log('📊 [processNavigationQueue] Updating state after animation:', {
          previousSection: currentSectionRef.current,
          newSection: request.targetSection,
          targetY
        });
        
        scrollState.updateState({
          currentSection: request.targetSection,
          targetSection: null,
          isAnimating: false,
          scrollPosition: targetY
        });
        
        // Update our ref immediately
        currentSectionRef.current = request.targetSection;
        
        console.log('📊 [processNavigationQueue] State after update:', {
          currentSection: currentSectionRef.current,
          isAnimating: scrollState.queries.isAnimating()
        });

        // Call completion callback
        request.options?.onComplete?.();
        
        // Process next request
        animationQueue.current.processing = false;
        processNavigationQueue();
      },
      onInterrupt: () => {
        console.log('⚠️ [processNavigationQueue] Animation interrupted');
        
        // Mark animation end in debouncing
        debouncing.markAnimationEnd(animationId);
        
        scrollState.updateState({ isAnimating: false, targetSection: null });
        request.options?.onInterrupt?.();
        animationQueue.current.processing = false;
      }
    });
  }, [scrollState, getEffectiveDuration, easing, debouncing]);

  const gotoSection = useCallback((index: number, options?: NavigationOptions) => {
    const clampedIndex = Math.max(0, Math.min(sections.length - 1, index));
    // Get the latest current section directly from the ref
    const currentSection = currentSectionRef.current;
    
    console.log('🎯 [gotoSection] Request:', {
      requested: index,
      clamped: clampedIndex,
      current: currentSection,
      queueStatus: {
        pending: animationQueue.current.requests.length,
        processing: animationQueue.current.processing
      }
    });

    // For button/programmatic navigation, be very responsive 
    const canNavigateNow = options?.force || debouncing.canNavigate() || 
      (Date.now() - stateRef.current.lastNavigationTime) > 20; // Allow very rapid button clicks

    if (!canNavigateNow && !options?.force) {
      console.log('🎯 [gotoSection] Navigation blocked by timing check');
      return;
    }

    // Update currentSectionRef immediately to provide instant feedback
    if (clampedIndex !== currentSection) {
      currentSectionRef.current = clampedIndex;
      stateRef.current.lastNavigationTime = Date.now();
    }

    const request = animationQueue.current.enqueue({ 
      targetSection: clampedIndex, 
      source: 'programmatic', 
      priority: options?.force ? 'high' : 'normal', 
      options 
    });

    console.log('📥 [gotoSection] Enqueue result:', {
      requestId: request?.id || 'null',
      queueLength: animationQueue.current.requests.length
    });

    if (request) {
      processNavigationQueue();
    }
  }, [sections.length, processNavigationQueue, debouncing]);

  const nextSection = useCallback(() => {
    // Get the latest current section directly from the ref
    const current = currentSectionRef.current;
    console.log('🔄 [nextSection] Called:', {
      currentSection: current,
      maxSection: sections.length - 1,
      canNavigate: current < sections.length - 1
    });
    if (current < sections.length - 1) {
      gotoSection(current + 1);
    }
  }, [gotoSection, sections.length]);

  const prevSection = useCallback(() => {
    // Get the latest current section directly from the ref
    const current = currentSectionRef.current;
    console.log('🔄 [prevSection] Called:', {
      currentSection: current,
      canNavigate: current > 0
    });
    if (current > 0) {
      gotoSection(current - 1);
    }
  }, [gotoSection]);

  const setupInputHandlers = useCallback(() => {
    const target = containerRef.current;
    
    if (!target) {
      console.error('🚨 [setupInputHandlers] containerRef.current is null! Observer cannot be created.');
      return;
    }
    
    // Observer for wheel/touch input
    controllers.current.observer = Observer.create({
      target,
      type: 'wheel,touch',
      tolerance,
      preventDefault,
      onChangeY: (self) => {
        console.log('🎯 [Observer] onChangeY triggered!', { deltaY: self.deltaY, velocityY: self.velocityY, eventType: self.event?.type });
        
        const velocity = self.velocityY || 0;
        const delta = self.deltaY || 0;
        const direction = invertDirection ? -Math.sign(delta) : Math.sign(delta);
        const eventType = self.event?.type;

        // Update velocity in state
        scrollState.setters.setVelocity(Math.abs(velocity));

        // More reliable wheel event detection
        const isWheelEvent = eventType === 'wheel';
        const isSignificantDelta = Math.abs(delta) > 10; // Lower threshold for better responsiveness
        const isMomentumScroll = Math.abs(velocity) > 100 && Math.abs(delta) < 10; // Tighter momentum detection

        // Handle momentum scrolling - mark scroll activity but don't navigate
        if (isMomentumScroll) {
          debouncing.markScrollStart();
          debouncing.markScrollEnd();
          return;
        }

        // Handle intentional wheel input
        if (isWheelEvent && isSignificantDelta) {
          // Check if we can navigate BEFORE marking scroll start to avoid self-blocking
          // For wheel events, we only check cooldown and animation state, not scrolling state
          const now = Date.now();
          const timeSinceLastNav = now - (stateRef.current.lastNavigationTime || 0);
          const cooldownMet = timeSinceLastNav >= 100; // 100ms cooldown for wheel events
          const notAnimating = !debouncing.isAnimating();
          const canNavigateNow = cooldownMet && notAnimating;
          
          if (!canNavigateNow) {
            return;
          }
          
          // Start scroll tracking after navigation check passes
          debouncing.markScrollStart();

          // Get the latest current section directly from the ref
          const current = currentSectionRef.current;
          const target = current + direction;

          if (target >= 0 && target < sections.length) {
            const request = animationQueue.current.enqueue({
              targetSection: target,
              source: 'user_wheel',
              priority: 'normal'
            });

            if (request) {
              processNavigationQueue();
            }
          }
          
          // End scroll tracking after processing
          debouncing.markScrollEnd();
        }
      }
    });

    console.log('✅ [setupInputHandlers] Observer created successfully for', target.className);

    // Keyboard navigation
    if (keyboardNavigation) {
      const handleKeydown = (e: KeyboardEvent) => {
        // Use debouncing to check if we can navigate
        if (!debouncing.canNavigate()) return;

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
    processNavigationQueue,
    debouncing
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

    // Stop Lenis RAF loop - we'll drive it with GSAP ticker
    controllers.current.lenis.stop();

    // Sync Lenis with GSAP ticker (this is the proper way)
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
    // Wait for DOM to be ready before setting up observers
    const waitForContainer = () => {
      return new Promise<void>((resolve) => {
        const checkContainer = () => {
          if (containerRef.current) {
            resolve();
          } else {
            requestAnimationFrame(checkContainer);
          }
        };
        checkContainer();
      });
    };

    await waitForContainer();

    // Initialize Lenis
    controllers.current.lenis = await initLenis();

    // Setup sync between Lenis and ScrollTrigger (this will stop Lenis RAF and use GSAP ticker)
    await setupScrollSync();

    // Setup input handlers AFTER container is guaranteed to be available
    setupInputHandlers();

    // Force initial state synchronization after a brief delay to allow DOM to settle
    setTimeout(() => {
      const currentScrollY = browserService.current.getScrollY();
      const viewportHeight = browserService.current.getInnerHeight();
      const calculatedSection = Math.round(currentScrollY / viewportHeight);

      // If there's a mismatch, force sync
      if (calculatedSection !== scrollState.queries.getCurrentSection()) {
        scrollState.updateState({
          currentSection: calculatedSection,
          scrollPosition: currentScrollY,
          targetSection: null,
          isAnimating: false
        });
        currentSectionRef.current = calculatedSection;
      }
    }, 100);

    // Set up periodic state verification
    controllers.current.verificationIntervalId = setInterval(() => {
      const verified = scrollState.verifyState();
      // If state was corrected, update our ref
      if (!verified) {
        currentSectionRef.current = scrollState.queries.getCurrentSection();
      }
    }, TIMING.STATE_VERIFICATION_INTERVAL);
  }, [setupScrollSync, setupInputHandlers, scrollState, browserService]);

  const destroy = useCallback(() => {

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
      console.log('🔧 [forceSync] Starting force sync');
      const currentScrollY = browserService.current.getScrollY();
      const viewportHeight = browserService.current.getInnerHeight();
      const calculatedSection = Math.round(currentScrollY / viewportHeight);
      const clampedSection = Math.max(0, Math.min(sections.length - 1, calculatedSection));
      
      console.log('🔧 [forceSync] Sync calculation:', {
        scrollY: currentScrollY,
        viewportHeight,
        calculatedSection,
        clampedSection,
        currentStateSection: scrollState.queries.getCurrentSection()
      });

      // Update both the state and our ref
      currentSectionRef.current = clampedSection;
      scrollState.updateState({
        currentSection: clampedSection,
        scrollPosition: currentScrollY,
        targetSection: null,
        isAnimating: false,
        isScrolling: false
      });

      // Use the existing forceSync utility for additional cleanup
      forceSync(clampedSection, stateRef, controllers.current, browserService.current, scrollState.updateState);
      
      console.log('🔧 [forceSync] Force sync completed');
    },
    emergencyReset: () => {
      // Also reset debouncing state on emergency reset
      debouncing.forceReset();
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
    }),
    updateConfig
  };
}