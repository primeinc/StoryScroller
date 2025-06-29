import type { RefObject } from 'react';
import type { ScrollState, AnimationControllers } from '../types/scroll-manager';
import type { IBrowserService } from '../services/BrowserService';

/**
 * Scroll synchronization utilities for the new scroll management system.
 * These functions help maintain consistency between scroll state and actual position.
 */

/** Forces all animation systems to sync to a specific section. */
export async function forceSync(
  targetSection: number,
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  updateState: (updates: Partial<ScrollState>) => void
) {
  console.warn(`🔄 FORCE SYNC triggered. Syncing to section: ${targetSection}`);

  // Use gsap from global or import
  const gsap = window.gsap || (await import('gsap')).gsap;
  const ScrollTrigger = window.ScrollTrigger || (await import('gsap/ScrollTrigger')).ScrollTrigger;
  
  gsap.killTweensOf(window);
  controllers.lenis?.stop();

  const targetY = targetSection * browserService.getInnerHeight();
  browserService.scrollTo(0, targetY);
  controllers.lenis?.scrollTo(targetY, { immediate: true });

  ScrollTrigger.refresh(true);

  // Update state using the new system
  updateState({
    currentSection: targetSection,
    targetSection: null,
    isAnimating: false,
    canNavigate: true,
    scrollPosition: targetY,
  });
}

/** Destroys and reinitializes everything. */
export async function emergencyReset(
  controllers: AnimationControllers,
  reinitialize: () => void,
  resetState: () => void
) {
  console.error("🚨 EMERGENCY RESET triggered. Reinitializing scroll system.");

  const gsap = window.gsap || (await import('gsap')).gsap;
  const ScrollTrigger = window.ScrollTrigger || (await import('gsap/ScrollTrigger')).ScrollTrigger;

  gsap.killTweensOf('*');
  ScrollTrigger.killAll();
  controllers.observer?.kill();
  controllers.lenis?.destroy();

  if (controllers.verificationIntervalId) clearInterval(controllers.verificationIntervalId);
  if (controllers.keyboardCleanup) controllers.keyboardCleanup();

  // Reset state using the new system
  resetState();
  reinitialize();
}

/** Periodically checks for state drift. */
export function verifyState(
  stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  updateState: (updates: Partial<ScrollState>) => void
) {
  if (!stateRef.current || stateRef.current.isAnimating) return;

  const actualY = browserService.getScrollY();
  const viewportHeight = browserService.getInnerHeight();
  const actualSection = Math.round(actualY / viewportHeight);

  if (actualSection !== stateRef.current.currentSection) {
    console.warn(`State drift detected! State: ${stateRef.current.currentSection}, Reality: ${actualSection}`);
    forceSync(actualSection, stateRef, controllers, browserService, updateState);
  }
}