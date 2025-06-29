/**
 * Animation Queue Logic - Unit Tests
 * 
 * Tests real queue behavior: enqueue, dequeue, deduplication, and processing state.
 * Focus on actual queue operations and timing behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnitTestHelpers } from './base-unit-test';
import { createAnimationQueue } from '../../src/utils/animation-queue';
import type { NavigationRequest } from '../../src/types/scroll-manager';
import { TIMING } from '../../src/constants/scroll-physics';

describe('Animation Queue Logic', () => {
  let queue: ReturnType<typeof createAnimationQueue>;

  beforeEach(() => {
    queue = createAnimationQueue();
  });

  describe('Queue Initialization', () => {
    it('should initialize with empty state', () => {
      expect(queue.requests).toEqual([]);
      expect(queue.processing).toBe(false);
      expect(queue.lastProcessedId).toBeNull();
    });

    it('should have all required methods', () => {
      expect(typeof queue.enqueue).toBe('function');
      expect(typeof queue.dequeue).toBe('function');
      expect(typeof queue.clear).toBe('function');
    });
  });

  describe('Enqueue Operations', () => {
    it('should add valid requests to queue', () => {
      const request = {
        targetSection: 2,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      };

      const result = queue.enqueue(request);

      expect(result).toBeTruthy();
      expect(result!.targetSection).toBe(2);
      expect(result!.source).toBe('user_keyboard');
      expect(result!.priority).toBe('normal');
      expect(result!.id).toMatch(/^nav_\d+$/);
      expect(result!.timestamp).toBeGreaterThan(0);
      expect(queue.requests).toHaveLength(1);
    });

    it('should generate unique IDs for requests', () => {
      const request1 = queue.enqueue({
        targetSection: 1,
        source: 'user_wheel' as const,
        priority: 'normal' as const,
      });

      const request2 = queue.enqueue({
        targetSection: 2,
        source: 'user_wheel' as const,
        priority: 'normal' as const,
      });

      expect(request1!.id).not.toBe(request2!.id);
      expect(request1!.timestamp).toBeLessThanOrEqual(request2!.timestamp);
    });

    it('should include all provided options in request', () => {
      const options = {
        duration: 0.5,
        immediate: true,
        onComplete: vi.fn(),
      };

      const result = queue.enqueue({
        targetSection: 3,
        source: 'programmatic' as const,
        priority: 'high' as const,
        options,
      });

      expect(result!.options).toEqual(options);
    });

    it('should handle requests without options', () => {
      const result = queue.enqueue({
        targetSection: 1,
        source: 'user_touch' as const,
        priority: 'low' as const,
      });

      expect(result!.options).toBeUndefined();
    });
  });

  describe('Deduplication Logic', () => {
    it('should reject duplicate requests within threshold', async () => {
      const request = {
        targetSection: 2,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      };

      // First request should succeed
      const first = queue.enqueue(request);
      expect(first).toBeTruthy();
      expect(queue.requests).toHaveLength(1);

      // Immediate duplicate should be rejected
      const duplicate = queue.enqueue(request);
      expect(duplicate).toBeNull();
      expect(queue.requests).toHaveLength(1);
    });

    it('should allow duplicate requests after threshold expires', async () => {
      const request = {
        targetSection: 2,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      };

      // First request
      const first = queue.enqueue(request);
      expect(first).toBeTruthy();

      // Wait for deduplication threshold to pass
      await new Promise(resolve => 
        setTimeout(resolve, TIMING.DEDUPLICATION_THRESHOLD + 10)
      );

      // Second request should now succeed
      const second = queue.enqueue(request);
      expect(second).toBeTruthy();
      expect(queue.requests).toHaveLength(2);
    });

    it('should allow different target sections immediately', () => {
      const request1 = queue.enqueue({
        targetSection: 1,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      const request2 = queue.enqueue({
        targetSection: 2,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      expect(request1).toBeTruthy();
      expect(request2).toBeTruthy();
      expect(queue.requests).toHaveLength(2);
    });

    it('should consider different sources as separate requests', () => {
      const baseRequest = {
        targetSection: 2,
        priority: 'normal' as const,
      };

      const keyboardRequest = queue.enqueue({
        ...baseRequest,
        source: 'user_keyboard' as const,
      });

      const wheelRequest = queue.enqueue({
        ...baseRequest,
        source: 'user_wheel' as const,
      });

      expect(keyboardRequest).toBeTruthy();
      expect(wheelRequest).toBeTruthy();
      expect(queue.requests).toHaveLength(2);
    });
  });

  describe('Dequeue Operations', () => {
    it('should return null when queue is empty', () => {
      const result = queue.dequeue();
      expect(result).toBeNull();
    });

    it('should return and remove first request (FIFO)', () => {
      // Add multiple requests
      const request1 = queue.enqueue({
        targetSection: 1,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      const request2 = queue.enqueue({
        targetSection: 2,
        source: 'user_wheel' as const,
        priority: 'normal' as const,
      });

      expect(queue.requests).toHaveLength(2);

      // Dequeue should return first request
      const dequeued = queue.dequeue();
      expect(dequeued).toEqual(request1);
      expect(queue.requests).toHaveLength(1);
      expect(queue.requests[0]).toEqual(request2);
    });

    it('should update lastProcessedId', () => {
      const request = queue.enqueue({
        targetSection: 1,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      const dequeued = queue.dequeue();
      expect(queue.lastProcessedId).toBe(request!.id);
    });

    it('should handle multiple dequeue operations', () => {
      // Add 3 requests
      const requests = [1, 2, 3].map(targetSection =>
        queue.enqueue({
          targetSection,
          source: 'user_keyboard' as const,
          priority: 'normal' as const,
        })
      );

      // Dequeue all
      const dequeued = [];
      let current;
      while ((current = queue.dequeue()) !== null) {
        dequeued.push(current);
      }

      expect(dequeued).toHaveLength(3);
      expect(dequeued[0]).toEqual(requests[0]);
      expect(dequeued[1]).toEqual(requests[1]);
      expect(dequeued[2]).toEqual(requests[2]);
      expect(queue.requests).toHaveLength(0);
    });
  });

  describe('Queue Clearing', () => {
    it('should clear empty queue without issues', () => {
      queue.clear();
      expect(queue.requests).toEqual([]);
      expect(queue.processing).toBe(false);
    });

    it('should clear queue with pending requests', () => {
      // Add some requests
      queue.enqueue({
        targetSection: 1,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      queue.enqueue({
        targetSection: 2,
        source: 'user_wheel' as const,
        priority: 'high' as const,
      });

      expect(queue.requests).toHaveLength(2);

      queue.clear();
      expect(queue.requests).toEqual([]);
      expect(queue.processing).toBe(false);
    });

    it('should reset processing state', () => {
      // Manually set processing state
      queue.processing = true;
      
      queue.clear();
      expect(queue.processing).toBe(false);
    });

    it('should preserve lastProcessedId after clear', () => {
      // Add and process a request
      const request = queue.enqueue({
        targetSection: 1,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      queue.dequeue();
      const lastId = queue.lastProcessedId;

      // Clear and check lastProcessedId is preserved
      queue.clear();
      expect(queue.lastProcessedId).toBe(lastId);
    });
  });

  describe('Request Validation', () => {
    it('should handle all valid source types', () => {
      const sources = ['user_wheel', 'user_keyboard', 'user_touch', 'programmatic', 'recovery', 'narrative'] as const;
      
      sources.forEach(source => {
        const request = queue.enqueue({
          targetSection: 1,
          source,
          priority: 'normal' as const,
        });
        
        expect(request).toBeTruthy();
        expect(request!.source).toBe(source);
      });
    });

    it('should handle all valid priority levels', () => {
      const priorities = ['low', 'normal', 'high', 'critical'] as const;
      
      priorities.forEach(priority => {
        const request = queue.enqueue({
          targetSection: 1,
          source: 'user_keyboard' as const,
          priority,
        });
        
        expect(request).toBeTruthy();
        expect(request!.priority).toBe(priority);
      });
    });

    it('should validate requests match interface', () => {
      const request = queue.enqueue({
        targetSection: 2,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      expect(request).toBeValidNavigationRequest();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large numbers of requests efficiently', async () => {
      const { duration } = await UnitTestHelpers.measureExecutionTime(() => {
        // Add 1000 requests
        for (let i = 0; i < 1000; i++) {
          queue.enqueue({
            targetSection: i % 5, // Cycle through sections
            source: 'programmatic' as const,
            priority: 'normal' as const,
          });
        }
      });

      // Should complete quickly
      expect(duration).toBeLessThan(50);
      expect(queue.requests.length).toBeGreaterThan(0); // Some should be added (not all duplicates)
    });

    it('should handle rapid dequeue operations', async () => {
      // Fill queue with non-duplicate requests
      for (let i = 0; i < 100; i++) {
        queue.enqueue({
          targetSection: i % 5,
          source: 'programmatic' as const,
          priority: 'normal' as const,
          options: { metadata: { requestIndex: i } }, // Make them unique
        });
      }

      const { duration } = await UnitTestHelpers.measureExecutionTime(() => {
        while (queue.dequeue() !== null) {
          // Dequeue all
        }
      });

      expect(duration).toBeLessThan(20);
      expect(queue.requests).toHaveLength(0);
    });

    it('should handle boundary section values', () => {
      // Test section 0
      const request0 = queue.enqueue({
        targetSection: 0,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });
      expect(request0!.targetSection).toBe(0);

      // Test large section number
      const request999 = queue.enqueue({
        targetSection: 999,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });
      expect(request999!.targetSection).toBe(999);
    });

    it('should maintain queue integrity during mixed operations', () => {
      // Mix of enqueue, dequeue, and clear operations
      const request1 = queue.enqueue({
        targetSection: 1,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      const request2 = queue.enqueue({
        targetSection: 2,
        source: 'user_wheel' as const,
        priority: 'high' as const,
      });

      expect(queue.requests).toHaveLength(2);

      const dequeued1 = queue.dequeue();
      expect(dequeued1).toEqual(request1);
      expect(queue.requests).toHaveLength(1);

      const request3 = queue.enqueue({
        targetSection: 3,
        source: 'programmatic' as const,
        priority: 'critical' as const,
      });

      expect(queue.requests).toHaveLength(2);

      queue.clear();
      expect(queue.requests).toHaveLength(0);

      const request4 = queue.enqueue({
        targetSection: 4,
        source: 'recovery' as const,
        priority: 'normal' as const,
      });

      expect(queue.requests).toHaveLength(1);
    });
  });

  describe('Real Queue Scenarios', () => {
    it('should handle user interaction patterns', async () => {
      // Simulate rapid user scrolling (wheel events)
      const wheelRequests = [];
      for (let i = 0; i < 5; i++) {
        const request = queue.enqueue({
          targetSection: 2, // User trying to go to same section
          source: 'user_wheel' as const,
          priority: 'normal' as const,
        });
        wheelRequests.push(request);
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms between events
      }

      // Only first should succeed due to deduplication
      expect(wheelRequests.filter(r => r !== null)).toHaveLength(1);
      expect(queue.requests).toHaveLength(1);
    });

    it('should handle keyboard navigation override', async () => {
      // User starts with wheel, then uses keyboard
      const wheelRequest = queue.enqueue({
        targetSection: 2,
        source: 'user_wheel' as const,
        priority: 'normal' as const,
      });

      const keyboardRequest = queue.enqueue({
        targetSection: 3, // Different target
        source: 'user_keyboard' as const,
        priority: 'high' as const,
      });

      expect(wheelRequest).toBeTruthy();
      expect(keyboardRequest).toBeTruthy();
      expect(queue.requests).toHaveLength(2);

      // Process in order (FIFO)
      const first = queue.dequeue();
      const second = queue.dequeue();

      expect(first).toEqual(wheelRequest);
      expect(second).toEqual(keyboardRequest);
    });

    it('should handle programmatic navigation during user interaction', () => {
      // User navigation in progress
      const userRequest = queue.enqueue({
        targetSection: 2,
        source: 'user_keyboard' as const,
        priority: 'normal' as const,
      });

      // Programmatic navigation (like auto-scroll)
      const programmaticRequest = queue.enqueue({
        targetSection: 3,
        source: 'programmatic' as const,
        priority: 'low' as const,
      });

      expect(queue.requests).toHaveLength(2);

      // Both should be queued, processed in order
      expect(queue.dequeue()).toEqual(userRequest);
      expect(queue.dequeue()).toEqual(programmaticRequest);
    });

    it('should demonstrate deduplication timing behavior', async () => {
      const targetSection = 2;
      const source = 'user_wheel' as const;
      const priority = 'normal' as const;

      // First request
      const first = queue.enqueue({ targetSection, source, priority });
      expect(first).toBeTruthy();

      // Immediate duplicate (should be rejected)
      const duplicate = queue.enqueue({ targetSection, source, priority });
      expect(duplicate).toBeNull();

      // Wait half the threshold
      await new Promise(resolve => 
        setTimeout(resolve, TIMING.DEDUPLICATION_THRESHOLD / 2)
      );

      // Still duplicate (should be rejected)
      const stillDuplicate = queue.enqueue({ targetSection, source, priority });
      expect(stillDuplicate).toBeNull();

      // Wait for full threshold + buffer
      await new Promise(resolve => 
        setTimeout(resolve, TIMING.DEDUPLICATION_THRESHOLD / 2 + 50)
      );

      // Now should be allowed
      const allowed = queue.enqueue({ targetSection, source, priority });
      expect(allowed).toBeTruthy();

      expect(queue.requests).toHaveLength(2);
    });
  });
});