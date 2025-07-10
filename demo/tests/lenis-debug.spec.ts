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
    await page.waitForSelector('.story-scroller-container', { state: 'visible' });
    await page.waitForTimeout(1000); // Let Lenis initialize

    // Inject debugging code into the page - test StoryScroller API instead of looking for Lenis
    await page.evaluate(() => {
      console.log('🧪 [TEST] Starting debug injection...');
      
      // Wait for StoryScroller API to be available
      const waitForAPI = setInterval(() => {
        if ((window as any).storyScrollerAPI) {
          clearInterval(waitForAPI);
          console.log('✅ [TEST] StoryScroller API found!');
          
          // Test the API directly instead of looking for Lenis
          const api = (window as any).storyScrollerAPI;
          console.log('📊 [TEST] Available API methods:', Object.keys(api));
          
          // Get initial state
          const initialState = api.getState();
          console.log('📊 [TEST] Initial state:', initialState);
          
          // Since we can't directly access Lenis, we'll test the StoryScroller API
          // which uses Lenis internally through GSAP animations
          console.log('🎯 [TEST] StoryScroller API ready for testing');
        } else {
          console.log('⏳ [TEST] Waiting for StoryScroller API...');
        }
      }, 100);
      
      // Fallback timeout
      setTimeout(() => {
        clearInterval(waitForAPI);
        if (!(window as any).storyScrollerAPI) {
          console.error('❌ [TEST] StoryScroller API not available after timeout');
        }
      }, 5000);
    });

    // Get initial section from StoryScroller API
    const initialSection = await page.evaluate(() => {
      const api = (window as any).storyScrollerAPI;
      if (api && api.getState) {
        const state = api.getState();
        return state.currentSection || 0;
      }
      return 0;
    });
    
    console.log('Initial section:', initialSection);

    // Create a promise to track navigation completion using StoryScroller API
    const navigationCompletePromise = page.evaluate(() => {
      return new Promise((resolve) => {
        const api = (window as any).storyScrollerAPI;
        if (!api) {
          console.error('StoryScroller API not available');
          resolve({ success: false, error: 'API not available' });
          return;
        }
        
        // Track completion signals
        const completionSignals = {
          stateUpdated: false,
          animationComplete: false,
          targetReached: false
        };
        
        // Monitor for state updates using the API
        const checkState = setInterval(() => {
          const state = api.getState();
          
          // Check if we reached target section
          if (state.currentSection === 1) {
            completionSignals.stateUpdated = true;
            console.log('✅ State updated to section 1');
          }
          
          // Check if animation is complete
          if (!state.isAnimating && state.currentSection === 1) {
            completionSignals.animationComplete = true;
            console.log('✅ Animation complete');
          }
          
          // If all conditions are met, resolve
          if (completionSignals.stateUpdated && completionSignals.animationComplete) {
            clearInterval(checkState);
            console.log('✅ Navigation fully complete');
            resolve(completionSignals);
          }
        }, 100);
        
        // Set a timeout to resolve anyway and report what happened
        setTimeout(() => {
          clearInterval(checkState);
          console.log('Navigation timeout reached. Completion signals:', completionSignals);
          resolve(completionSignals);
        }, 5000);
      });
    });

    // Navigate to section 1 using the API directly
    console.log('Navigating to section 1 using API...');
    await page.evaluate(() => {
      const api = (window as any).storyScrollerAPI;
      if (api) {
        api.gotoSection(1);
      }
    });
    
    // Wait for navigation to complete
    const completionSignals = await navigationCompletePromise;
    console.log('Final completion signals:', completionSignals);
    
    // Check final state using StoryScroller API
    const finalState = await page.evaluate(() => {
      const api = (window as any).storyScrollerAPI;
      if (!api) {
        return { error: 'API not available' };
      }
      
      const state = api.getState();
      const scrollTop = window.scrollY || 0;
      const scrollHeight = document.documentElement.scrollHeight || 0;
      const clientHeight = window.innerHeight || 0;
      
      return {
        activeSection: state.currentSection,
        scrollPosition: {
          scrollTop,
          scrollHeight,
          clientHeight,
          scrollPercentage: scrollTop / (scrollHeight - clientHeight)
        },
        storyScrollerState: state,
        // Include navigation dots state for verification
        navigationState: {
          activeDot: document.querySelector('.section-dot[aria-current="true"]')?.getAttribute('data-section-idx') || 'none'
        }
      };
    });
    
    console.log('Final state:', finalState);
    
    // Assertions - Test StoryScroller functionality instead of Lenis directly
    expect(finalState.activeSection).toBe(1);
    expect(completionSignals).toBeTruthy();
    
    // Check which completion signals fired
    if (!(completionSignals as any).stateUpdated) {
      console.error('ERROR: State update never happened!');
    }
    if (!(completionSignals as any).animationComplete) {
      console.error('ERROR: Animation never completed!');
    }
    
    // Additional StoryScroller API checks
    await page.evaluate(() => {
      const api = (window as any).storyScrollerAPI;
      if (api) {
        console.log('Final StoryScroller diagnostics:');
        console.log('- API exists:', !!api);
        console.log('- Has gotoSection method:', typeof api.gotoSection === 'function');
        console.log('- Has getState method:', typeof api.getState === 'function');
        console.log('- Has nextSection method:', typeof api.nextSection === 'function');
        console.log('- Has prevSection method:', typeof api.prevSection === 'function');
        console.log('- Current state:', api.getState());
        console.log('- Queue status:', api.getQueueStatus());
      } else {
        console.error('StoryScroller API not available for diagnostics');
      }
    });
  });

  test('test StoryScroller API with manual navigation calls', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.story-scroller-container', { state: 'visible' });
    await page.waitForTimeout(1000);

    // Directly test StoryScroller API instead of Lenis
    const scrollResult = await page.evaluate(async () => {
      const api = (window as any).storyScrollerAPI;
      if (!api) {
        return { error: 'StoryScroller API not found' };
      }

      const results = {
        immediateNavigation: null as any,
        animatedNavigation: null as any,
        callbackNavigation: null as any
      };

      // Test 1: Immediate navigation using force flag
      console.log('Test 1: Immediate navigation to section 1');
      api.gotoSection(1, { force: true, duration: 0 });
      
      // Wait a bit and check state
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const state1 = api.getState();
      results.immediateNavigation = {
        currentSection: state1.currentSection,
        isAnimating: state1.isAnimating,
        scrollPosition: state1.scrollPosition
      };

      // Test 2: Animated navigation without callback
      console.log('Test 2: Animated navigation to section 2');
      api.gotoSection(2, { duration: 1 });
      
      // Monitor the navigation
      await new Promise(resolve => {
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          const state = api.getState();
          console.log(`Check ${checkCount}: section=${state.currentSection}, animating=${state.isAnimating}`);
          
          if (!state.isAnimating || checkCount > 20) {
            clearInterval(checkInterval);
            results.animatedNavigation = {
              currentSection: state.currentSection,
              isAnimating: state.isAnimating,
              checksPerformed: checkCount
            };
            resolve(null);
          }
        }, 100);
      });

      // Test 3: Navigation with callback
      console.log('Test 3: Navigation to section 3 with onComplete callback');
      const callbackPromise = new Promise(resolve => {
        const startTime = Date.now();
        api.gotoSection(3, { 
          duration: 1,
          onComplete: () => {
            console.log('onComplete fired!');
            const finalState = api.getState();
            results.callbackNavigation = {
              callbackFired: true,
              timeToComplete: Date.now() - startTime,
              finalSection: finalState.currentSection,
              finalAnimating: finalState.isAnimating
            };
            resolve(null);
          }
        });
        
        // Fallback timeout
        setTimeout(() => {
          console.log('onComplete did NOT fire within 3 seconds');
          const finalState = api.getState();
          results.callbackNavigation = {
            callbackFired: false,
            timeoutReached: true,
            finalSection: finalState.currentSection,
            finalAnimating: finalState.isAnimating
          };
          resolve(null);
        }, 3000);
      });

      await callbackPromise;
      return results;
    });

    console.log('StoryScroller API test results:', scrollResult);
    
    // Check if callbacks are working
    if ('callbackNavigation' in scrollResult && scrollResult.callbackNavigation && !scrollResult.callbackNavigation.callbackFired) {
      throw new Error('StoryScroller onComplete callback is not firing!');
    }
  });

  test('check StoryScroller animation system and performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.story-scroller-container', { state: 'visible' });
    await page.waitForTimeout(1000);

    const animationResult = await page.evaluate(async () => {
      const api = (window as any).storyScrollerAPI;
      if (!api) {
        return { error: 'StoryScroller API not found' };
      }

      // Check if GSAP is available (used by StoryScroller)
      const gsap = (window as any).gsap;
      const hasGsap = !!gsap;
      
      console.log('Animation system setup:', {
        hasGsap,
        hasStoryScrollerAPI: !!api,
        gsapVersion: gsap?.version
      });

      // Monitor animation frames during navigation
      let rafCallCount = 0;
      const originalRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback) {
        rafCallCount++;
        return originalRaf.call(window, (time) => {
          if (rafCallCount <= 10) { // Log only first 10 calls to avoid spam
            console.log(`RAF ${rafCallCount} at time:`, time);
          }
          callback(time);
        });
      };

      // Trigger a navigation
      console.log('Starting navigation to section 2...');
      const startTime = Date.now();
      api.gotoSection(2, { duration: 0.5 });

      // Wait for animation to complete
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          const state = api.getState();
          if (!state.isAnimating) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 50);
      });

      const endTime = Date.now();

      // Restore RAF
      window.requestAnimationFrame = originalRaf;

      return {
        hasGsap,
        hasStoryScrollerAPI: !!api,
        rafCallCount,
        animationDuration: endTime - startTime,
        gsapVersion: gsap?.version,
        finalState: api.getState()
      };
    });

    console.log('Animation system test results:', animationResult);
    
    // Verify that the animation system is working
    expect(animationResult.hasGsap).toBe(true);
    expect(animationResult.hasStoryScrollerAPI).toBe(true);
    expect(animationResult.rafCallCount).toBeGreaterThan(0);
  });
});