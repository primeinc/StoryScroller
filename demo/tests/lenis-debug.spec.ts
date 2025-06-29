import { test, expect } from '@playwright/test';

test.describe('Lenis Animation Completion Debug', () => {
  test('debug Lenis onComplete callback not firing', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    });

    // Navigate to the demo page
    await page.goto('/');
    
    // Wait for StoryScroller to be ready
    await page.waitForSelector('.story-scroller', { state: 'visible' });
    await page.waitForTimeout(1000); // Let Lenis initialize

    // Inject debugging code into the page
    await page.evaluate(() => {
      // Add global debug flag
      (window as any).LENIS_DEBUG = true;
      
      // Get Lenis instance from StoryScroller
      const storyScroller = document.querySelector('.story-scroller');
      if (!storyScroller) {
        console.error('No StoryScroller found');
        return;
      }

      // Access Lenis through React fiber (hacky but works for debugging)
      const reactFiber = (storyScroller as any)._reactInternalFiber || 
                        (storyScroller as any)._reactInternalInstance ||
                        Object.keys(storyScroller).find(k => k.startsWith('__reactInternalInstance')) &&
                        (storyScroller as any)[Object.keys(storyScroller).find(k => k.startsWith('__reactInternalInstance'))!];
      
      console.log('React Fiber found:', !!reactFiber);
      
      // Try to find Lenis instance in window or global scope
      const lenis = (window as any).lenis || (window as any).__lenis;
      if (lenis) {
        console.log('Found Lenis instance:', lenis);
        console.log('Lenis version:', lenis.version);
        console.log('Lenis options:', lenis.options);
        
        // Patch scrollTo to debug
        const originalScrollTo = lenis.scrollTo.bind(lenis);
        lenis.scrollTo = function(target: any, options: any = {}) {
          console.log('Lenis scrollTo called with:', { target, options });
          
          // Wrap the onComplete callback
          const originalOnComplete = options.onComplete;
          options.onComplete = function() {
            console.log('Lenis onComplete callback fired!');
            if (originalOnComplete) {
              originalOnComplete();
            }
          };
          
          // Call original scrollTo
          const result = originalScrollTo(target, options);
          console.log('Lenis scrollTo returned:', result);
          
          // Monitor scroll position
          let lastProgress = 0;
          const checkProgress = setInterval(() => {
            const progress = lenis.progress;
            const targetProgress = lenis.targetProgress;
            const velocity = lenis.velocity;
            const isScrolling = lenis.isScrolling;
            
            if (Math.abs(progress - lastProgress) > 0.001) {
              console.log('Lenis state:', {
                progress,
                targetProgress,
                velocity,
                isScrolling,
                delta: progress - lastProgress
              });
              lastProgress = progress;
            }
            
            // Stop monitoring when not scrolling
            if (!isScrolling && Math.abs(velocity) < 0.01) {
              clearInterval(checkProgress);
              console.log('Lenis stopped scrolling');
            }
          }, 100);
          
          return result;
        };
        
        // Also monitor the raf callback
        if (lenis.raf) {
          const originalRaf = lenis.raf.bind(lenis);
          lenis.raf = function(time: number) {
            if ((window as any).LENIS_DEBUG) {
              console.log('Lenis RAF called at:', time);
            }
            return originalRaf(time);
          };
        }
      } else {
        console.error('Lenis instance not found in window');
      }
      
      // Also check for GSAP
      const gsap = (window as any).gsap;
      if (gsap) {
        console.log('GSAP found, version:', gsap.version);
      }
    });

    // Get initial section
    const initialSection = await page.evaluate(() => {
      const indicators = document.querySelectorAll('.story-navigation button');
      const activeIndicator = Array.from(indicators).findIndex(btn => 
        btn.getAttribute('aria-current') === 'true'
      );
      return activeIndicator;
    });
    
    console.log('Initial section:', initialSection);

    // Create a promise to track navigation completion
    const navigationCompletePromise = page.evaluate(() => {
      return new Promise((resolve) => {
        // Track various completion signals
        const completionSignals = {
          lenisOnComplete: false,
          gsapComplete: false,
          stateUpdated: false,
          scrollPositionReached: false
        };
        
        // Monitor for state updates
        const checkState = setInterval(() => {
          const indicators = document.querySelectorAll('.story-navigation button');
          const activeIndicator = Array.from(indicators).findIndex(btn => 
            btn.getAttribute('aria-current') === 'true'
          );
          
          if (activeIndicator === 1) {
            completionSignals.stateUpdated = true;
            console.log('State updated to section 1');
          }
        }, 100);
        
        // Set a timeout to resolve anyway and report what happened
        setTimeout(() => {
          clearInterval(checkState);
          console.log('Navigation timeout reached. Completion signals:', completionSignals);
          resolve(completionSignals);
        }, 5000);
        
        // Store resolver globally for other code to use
        (window as any).__navigationResolver = (signal: string) => {
          (completionSignals as any)[signal] = true;
          console.log(`Signal received: ${signal}`, completionSignals);
          
          // Check if all expected signals are received
          if (completionSignals.lenisOnComplete || completionSignals.gsapComplete) {
            clearInterval(checkState);
            setTimeout(() => resolve(completionSignals), 100);
          }
        };
      });
    });

    // Click on second navigation indicator
    console.log('Clicking navigation indicator 1...');
    await page.click('.story-navigation button:nth-child(2)');
    
    // Wait for navigation to complete
    const completionSignals = await navigationCompletePromise;
    console.log('Final completion signals:', completionSignals);
    
    // Check final state
    const finalState = await page.evaluate(() => {
      const indicators = document.querySelectorAll('.story-navigation button');
      const activeIndicator = Array.from(indicators).findIndex(btn => 
        btn.getAttribute('aria-current') === 'true'
      );
      
      const scrollContainer = document.querySelector('.story-scroller');
      const scrollTop = scrollContainer?.scrollTop || 0;
      const scrollHeight = scrollContainer?.scrollHeight || 0;
      const clientHeight = scrollContainer?.clientHeight || 0;
      
      // Check if Lenis is still available
      const lenis = (window as any).lenis || (window as any).__lenis;
      const lenisState = lenis ? {
        progress: lenis.progress,
        targetProgress: lenis.targetProgress,
        velocity: lenis.velocity,
        isScrolling: lenis.isScrolling,
        scroll: lenis.scroll,
        limit: lenis.limit
      } : null;
      
      return {
        activeSection: activeIndicator,
        scrollPosition: {
          scrollTop,
          scrollHeight,
          clientHeight,
          scrollPercentage: scrollTop / (scrollHeight - clientHeight)
        },
        lenisState
      };
    });
    
    console.log('Final state:', finalState);
    
    // Assertions
    expect(finalState.activeSection).toBe(1);
    expect(completionSignals).toBeTruthy();
    
    // Check which completion signals fired
    if (!(completionSignals as any).lenisOnComplete) {
      console.error('ERROR: Lenis onComplete callback never fired!');
    }
    if (!(completionSignals as any).gsapComplete) {
      console.log('Note: GSAP complete callback did not fire (may not be used)');
    }
    
    // Additional Lenis-specific checks
    await page.evaluate(() => {
      const lenis = (window as any).lenis || (window as any).__lenis;
      if (lenis) {
        console.log('Final Lenis diagnostics:');
        console.log('- Instance exists:', !!lenis);
        console.log('- Has scrollTo method:', typeof lenis.scrollTo === 'function');
        console.log('- Has on method:', typeof lenis.on === 'function');
        console.log('- Has emit method:', typeof lenis.emit === 'function');
        console.log('- Options:', lenis.options);
        console.log('- Root element:', lenis.rootElement);
        console.log('- Animated scroll:', lenis.animatedScroll);
        
        // Check if there are any event listeners
        if (lenis._emitter) {
          console.log('- Event emitter exists:', !!lenis._emitter);
          console.log('- Event listeners:', lenis._emitter._events);
        }
      }
    });
  });

  test('test Lenis scrollTo with manual API calls', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.story-scroller', { state: 'visible' });
    await page.waitForTimeout(1000);

    // Directly test Lenis scrollTo API
    const scrollResult = await page.evaluate(async () => {
      const lenis = (window as any).lenis || (window as any).__lenis;
      if (!lenis) {
        return { error: 'Lenis not found' };
      }

      const results = {
        immediateScroll: null as any,
        animatedScroll: null as any,
        callbackScroll: null as any
      };

      // Test 1: Immediate scroll
      console.log('Test 1: Immediate scroll to 500px');
      lenis.scrollTo(500, { immediate: true });
      results.immediateScroll = {
        scroll: lenis.scroll,
        targetScroll: lenis.targetScroll,
        isScrolling: lenis.isScrolling
      };

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test 2: Animated scroll without callback
      console.log('Test 2: Animated scroll to 1000px without callback');
      lenis.scrollTo(1000, { duration: 1 });
      
      // Monitor the scroll
      await new Promise(resolve => {
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          console.log(`Check ${checkCount}: scroll=${lenis.scroll}, target=${lenis.targetScroll}, scrolling=${lenis.isScrolling}`);
          
          if (!lenis.isScrolling || checkCount > 20) {
            clearInterval(checkInterval);
            results.animatedScroll = {
              scroll: lenis.scroll,
              targetScroll: lenis.targetScroll,
              isScrolling: lenis.isScrolling,
              checksPerformed: checkCount
            };
            resolve(null);
          }
        }, 100);
      });

      // Test 3: Animated scroll with callback
      console.log('Test 3: Animated scroll to 1500px with onComplete callback');
      const callbackPromise = new Promise(resolve => {
        const startTime = Date.now();
        lenis.scrollTo(1500, { 
          duration: 1,
          onComplete: () => {
            console.log('onComplete fired!');
            results.callbackScroll = {
              callbackFired: true,
              timeToComplete: Date.now() - startTime,
              finalScroll: lenis.scroll,
              finalTarget: lenis.targetScroll
            };
            resolve(null);
          }
        });
        
        // Fallback timeout
        setTimeout(() => {
          console.log('onComplete did NOT fire within 3 seconds');
          results.callbackScroll = {
            callbackFired: false,
            timeoutReached: true,
            finalScroll: lenis.scroll,
            finalTarget: lenis.targetScroll
          };
          resolve(null);
        }, 3000);
      });

      await callbackPromise;
      return results;
    });

    console.log('Lenis API test results:', scrollResult);
    
    // Check if callbacks are working
    if (scrollResult.callbackScroll && !scrollResult.callbackScroll.callbackFired) {
      throw new Error('Lenis onComplete callback is not firing!');
    }
  });

  test('check Lenis RAF loop and animation frame', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.story-scroller', { state: 'visible' });
    await page.waitForTimeout(1000);

    const rafResult = await page.evaluate(async () => {
      const lenis = (window as any).lenis || (window as any).__lenis;
      if (!lenis) {
        return { error: 'Lenis not found' };
      }

      // Check if Lenis has its own RAF or uses external
      const hasOwnRaf = typeof lenis.raf === 'function';
      const usesExternalRaf = !hasOwnRaf;
      
      console.log('Lenis RAF setup:', {
        hasOwnRaf,
        usesExternalRaf,
        autoRaf: lenis.options?.autoRaf
      });

      // Monitor RAF calls
      let rafCallCount = 0;
      const originalRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback) {
        rafCallCount++;
        return originalRaf.call(window, (time) => {
          console.log(`RAF ${rafCallCount} at time:`, time);
          callback(time);
        });
      };

      // Trigger a scroll
      lenis.scrollTo(1000, { duration: 0.5 });

      // Wait and count RAF calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Restore RAF
      window.requestAnimationFrame = originalRaf;

      return {
        hasOwnRaf,
        usesExternalRaf,
        rafCallCount,
        autoRaf: lenis.options?.autoRaf
      };
    });

    console.log('RAF test results:', rafResult);
  });
});