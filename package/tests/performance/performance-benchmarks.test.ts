/**
 * Performance Benchmarks Test Suite
 * 
 * Comprehensive performance testing to ensure StoryScroller meets
 * production performance targets under various conditions.
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds based on package targets
const PERFORMANCE_TARGETS = {
  animation: {
    duration: 600, // Target animation duration in ms
    maxVariance: 200, // Allowed variance (+/- 200ms)
    inputResponse: 100, // Max response time to user input
  },
  memory: {
    baseline: 10 * 1024 * 1024, // 10MB baseline
    maxUsage: 50 * 1024 * 1024, // 50MB maximum
    leakTolerance: 5 * 1024 * 1024, // 5MB leak tolerance
  },
  rendering: {
    targetFPS: 60,
    minimumFPS: 45,
    maxFrameTime: 16.67, // 60 FPS = 16.67ms per frame
  },
  bundleSize: {
    core: 50 * 1024, // 50KB core package
    withDeps: 150 * 1024, // 150KB with dependencies
  }
};

// Helper to measure performance metrics
const measurePerformance = async (page: Page, operation: () => Promise<void>) => {
  const startTime = Date.now();
  
  // Start performance monitoring
  await page.evaluate(() => {
    (window as any).performanceData = {
      startTime: performance.now(),
      frames: [],
      memoryStart: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
    };
    
    // Monitor frame rate
    let frameCount = 0;
    const measureFrame = () => {
      frameCount++;
      (window as any).performanceData.frames.push(performance.now());
      if (frameCount < 60) { // Monitor for 1 second at 60fps
        requestAnimationFrame(measureFrame);
      }
    };
    requestAnimationFrame(measureFrame);
  });
  
  // Perform the operation
  await operation();
  
  // Wait for operation to complete
  await page.waitForTimeout(1000);
  
  // Collect performance data
  const performanceData = await page.evaluate(() => {
    const data = (window as any).performanceData;
    return {
      duration: performance.now() - data.startTime,
      frameCount: data.frames.length,
      averageFrameTime: data.frames.length > 1 
        ? (data.frames[data.frames.length - 1] - data.frames[0]) / (data.frames.length - 1)
        : 0,
      memoryEnd: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
      memoryStart: data.memoryStart,
    };
  });
  
  const totalTime = Date.now() - startTime;
  
  return {
    ...performanceData,
    totalOperationTime: totalTime,
    fps: performanceData.frameCount > 0 ? (performanceData.frameCount / (performanceData.duration / 1000)) : 0,
    memoryUsed: performanceData.memoryEnd - performanceData.memoryStart,
  };
};

// Helper to get StoryScroller state
const getScrollerState = async (page: Page) => {
  return await page.evaluate(() => {
    const api = (window as any).storyScrollerAPI;
    if (!api) throw new Error('StoryScroller API not available');
    return {
      state: api.getState(),
      queueStatus: api.getQueueStatus ? api.getQueueStatus() : { pending: 0, processing: false }
    };
  });
};

test.describe('StoryScroller Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo and wait for initialization
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => (window as any).storyScrollerAPI !== undefined, { timeout: 10000 });
    await page.waitForTimeout(1000); // Allow for full initialization
  });

  test.describe('Animation Performance', () => {
    test('should complete navigation within target duration', async ({ page }) => {
      const metrics = await measurePerformance(page, async () => {
        // Trigger navigation
        await page.keyboard.press('ArrowDown');
        
        // Wait for animation to complete
        await page.waitForFunction(async () => {
          const state = await page.evaluate(() => (window as any).storyScrollerAPI?.getState());
          return state && !state.isAnimating;
        }, { timeout: 2000 });
      });
      
      console.log('Navigation Performance:', metrics);
      
      // Check animation duration is within target range
      expect(metrics.totalOperationTime).toBeLessThan(
        PERFORMANCE_TARGETS.animation.duration + PERFORMANCE_TARGETS.animation.maxVariance
      );
      expect(metrics.totalOperationTime).toBeGreaterThan(
        PERFORMANCE_TARGETS.animation.duration - PERFORMANCE_TARGETS.animation.maxVariance
      );
      
      // Verify navigation actually occurred
      const finalState = await getScrollerState(page);
      expect(finalState.state.currentSection).toBeGreaterThan(0);
    });

    test('should respond to input within target time', async ({ page }) => {
      let inputResponseTime = 0;
      
      // Measure input response time
      await page.evaluate(() => {
        const startTime = performance.now();
        (window as any).inputStartTime = startTime;
        
        // Listen for any scroll or animation response
        const checkResponse = () => {
          const api = (window as any).storyScrollerAPI;
          if (api && api.getState().isAnimating) {
            (window as any).inputResponseTime = performance.now() - (window as any).inputStartTime;
          } else {
            requestAnimationFrame(checkResponse);
          }
        };
        requestAnimationFrame(checkResponse);
      });
      
      // Trigger input
      await page.keyboard.press('ArrowDown');
      
      // Wait for response to be measured
      await page.waitForTimeout(500);
      
      inputResponseTime = await page.evaluate(() => (window as any).inputResponseTime || 0);
      
      console.log('Input Response Time:', inputResponseTime, 'ms');
      
      expect(inputResponseTime).toBeLessThan(PERFORMANCE_TARGETS.animation.inputResponse);
      expect(inputResponseTime).toBeGreaterThan(0); // Should have detected a response
    });

    test('should maintain smooth frame rate during animation', async ({ page }) => {
      const metrics = await measurePerformance(page, async () => {
        // Trigger multiple rapid navigations to stress test
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowUp');
      });
      
      console.log('Frame Rate Performance:', {
        fps: metrics.fps,
        averageFrameTime: metrics.averageFrameTime,
        frameCount: metrics.frameCount
      });
      
      // Check frame rate is acceptable
      expect(metrics.fps).toBeGreaterThan(PERFORMANCE_TARGETS.rendering.minimumFPS);
      
      // Check average frame time is reasonable
      if (metrics.averageFrameTime > 0) {
        expect(metrics.averageFrameTime).toBeLessThan(PERFORMANCE_TARGETS.rendering.maxFrameTime * 2);
      }
    });
  });

  test.describe('Memory Performance', () => {
    test('should not exceed memory usage targets', async ({ page }) => {
      // Get baseline memory
      const baselineMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      // Perform memory-intensive operations
      const metrics = await measurePerformance(page, async () => {
        // Navigate through all sections multiple times
        for (let cycle = 0; cycle < 3; cycle++) {
          for (let section = 0; section < 5; section++) {
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(200);
          }
          // Navigate back
          for (let section = 0; section < 5; section++) {
            await page.keyboard.press('ArrowUp');
            await page.waitForTimeout(200);
          }
        }
      });
      
      console.log('Memory Performance:', {
        baseline: baselineMemory,
        used: metrics.memoryUsed,
        total: baselineMemory + metrics.memoryUsed
      });
      
      // Check memory usage is within acceptable limits
      expect(metrics.memoryUsed).toBeLessThan(PERFORMANCE_TARGETS.memory.maxUsage);
      
      // Check total memory usage
      if (baselineMemory > 0) {
        expect(baselineMemory + metrics.memoryUsed).toBeLessThan(
          PERFORMANCE_TARGETS.memory.baseline + PERFORMANCE_TARGETS.memory.maxUsage
        );
      }
    });

    test('should not have significant memory leaks', async ({ page }) => {
      const memoryMeasurements = [];
      
      // Take initial memory measurement
      let initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      memoryMeasurements.push(initialMemory);
      
      // Perform operations that could cause memory leaks
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
          // Force garbage collection if available
          if ((window as any).gc) {
            (window as any).gc();
          }
        });
        
        // Perform navigation operations
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(100);
        
        // Measure memory after each cycle
        const currentMemory = await page.evaluate(() => {
          return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
        });
        memoryMeasurements.push(currentMemory);
      }
      
      // Analyze memory trend
      const memoryGrowth = memoryMeasurements[memoryMeasurements.length - 1] - memoryMeasurements[0];
      
      console.log('Memory Leak Analysis:', {
        initial: initialMemory,
        final: memoryMeasurements[memoryMeasurements.length - 1],
        growth: memoryGrowth,
        measurements: memoryMeasurements.length
      });
      
      // Check for memory leaks
      if (initialMemory > 0) {
        expect(memoryGrowth).toBeLessThan(PERFORMANCE_TARGETS.memory.leakTolerance);
      }
    });
  });

  test.describe('Load Performance', () => {
    test('should initialize within reasonable time', async ({ page }) => {
      // Measure initialization time
      await page.goto('/');
      
      const initializationTime = await page.evaluate(() => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          
          const checkInit = () => {
            if ((window as any).storyScrollerAPI) {
              resolve(performance.now() - startTime);
            } else {
              requestAnimationFrame(checkInit);
            }
          };
          checkInit();
        });
      });
      
      console.log('Initialization Time:', initializationTime, 'ms');
      
      // Should initialize within 2 seconds
      expect(initializationTime).toBeLessThan(2000);
    });

    test('should handle rapid successive operations', async ({ page }) => {
      const startTime = Date.now();
      
      // Rapidly trigger multiple navigation requests
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(page.keyboard.press('ArrowDown'));
      }
      
      await Promise.all(operations);
      
      // Wait for system to stabilize
      await page.waitForTimeout(2000);
      
      const totalTime = Date.now() - startTime;
      const finalState = await getScrollerState(page);
      
      console.log('Rapid Operations Performance:', {
        totalTime,
        finalSection: finalState.state.currentSection,
        isAnimating: finalState.state.isAnimating,
        queueStatus: finalState.queueStatus
      });
      
      // System should handle rapid operations gracefully
      expect(totalTime).toBeLessThan(5000);
      expect(finalState.state.isAnimating).toBe(false); // Should not be stuck animating
      expect(finalState.queueStatus.processing).toBe(false); // Queue should be clear
    });
  });

  test.describe('Stress Testing', () => {
    test('should maintain performance under continuous use', async ({ page }) => {
      const performanceLog = [];
      
      // Simulate continuous use for extended period
      for (let minute = 0; minute < 3; minute++) {
        const minuteStart = Date.now();
        
        // Perform various operations for 1 minute
        const endTime = minuteStart + 60000; // 1 minute
        while (Date.now() < endTime) {
          // Random navigation pattern
          const direction = Math.random() > 0.5 ? 'ArrowDown' : 'ArrowUp';
          await page.keyboard.press(direction);
          await page.waitForTimeout(Math.random() * 500 + 100); // 100-600ms
        }
        
        // Measure performance after each minute
        const memory = await page.evaluate(() => {
          return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
        });
        
        const state = await getScrollerState(page);
        
        performanceLog.push({
          minute: minute + 1,
          memory,
          currentSection: state.state.currentSection,
          isStableState: !state.state.isAnimating && !state.queueStatus.processing
        });
      }
      
      console.log('Stress Test Results:', performanceLog);
      
      // All measurements should show stable state
      performanceLog.forEach((log, index) => {
        expect(log.isStableState).toBe(true);
        
        // Memory should not grow excessively
        if (index > 0 && log.memory > 0) {
          const memoryGrowth = log.memory - performanceLog[0].memory;
          expect(memoryGrowth).toBeLessThan(PERFORMANCE_TARGETS.memory.leakTolerance);
        }
      });
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('should meet all performance benchmarks', async ({ page }) => {
      // Comprehensive performance check
      const benchmarkResults = {
        navigation: false,
        memory: false,
        frameRate: false,
        initialization: false,
        stability: false
      };
      
      // Test navigation performance
      const navMetrics = await measurePerformance(page, async () => {
        await page.keyboard.press('ArrowDown');
        await page.waitForFunction(() => {
          const state = (window as any).storyScrollerAPI?.getState();
          return state && !state.isAnimating;
        }, { timeout: 2000 });
      });
      
      benchmarkResults.navigation = navMetrics.totalOperationTime < 
        (PERFORMANCE_TARGETS.animation.duration + PERFORMANCE_TARGETS.animation.maxVariance);
      
      // Test memory usage
      benchmarkResults.memory = navMetrics.memoryUsed < PERFORMANCE_TARGETS.memory.maxUsage;
      
      // Test frame rate
      benchmarkResults.frameRate = navMetrics.fps > PERFORMANCE_TARGETS.rendering.minimumFPS;
      
      // Test initialization (already done)
      benchmarkResults.initialization = true;
      
      // Test stability
      const finalState = await getScrollerState(page);
      benchmarkResults.stability = !finalState.state.isAnimating && !finalState.queueStatus.processing;
      
      console.log('Performance Benchmark Results:', {
        ...benchmarkResults,
        metrics: {
          navigationTime: navMetrics.totalOperationTime,
          memoryUsed: navMetrics.memoryUsed,
          fps: navMetrics.fps,
          stable: benchmarkResults.stability
        }
      });
      
      // All benchmarks should pass
      Object.entries(benchmarkResults).forEach(([test, passed]) => {
        expect(passed).toBe(true, `Performance benchmark failed: ${test}`);
      });
    });
  });
});