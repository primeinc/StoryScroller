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
  _stateRef: RefObject<ScrollState>,
  controllers: AnimationControllers,
  browserService: IBrowserService,
  updateState: (updates: Partial<ScrollState>) => void
) {
  console.warn(`🔄 FORCE SYNC triggered. Syncing to section: ${targetSection}`);

  // Use gsap from global or import
  const gsap = (window as any).gsap || (await import('gsap')).default;
  const ScrollTrigger = (window as any).ScrollTrigger || (await import('gsap/ScrollTrigger.js')).ScrollTrigger;
  
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

  const gsap = (window as any).gsap || (await import('gsap')).default;
  const ScrollTrigger = (window as any).ScrollTrigger || (await import('gsap/ScrollTrigger.js')).ScrollTrigger;

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