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


import type { NavigationRequest, AnimationQueue } from '../types/scroll-manager';
import { TIMING } from '../constants/scroll-physics';

// Counter for unique ID generation
let idCounter = 0;

/** Creates and returns a new animation queue instance. */
export function createAnimationQueue(): AnimationQueue {
  const state = {
    requests: [] as NavigationRequest[],
    processing: false,
    lastProcessedId: null as string | null,
  };

  const enqueue = (request: Omit<NavigationRequest, 'id' | 'timestamp'>): NavigationRequest | null => {
    const timestamp = Date.now();
    const fullRequest: NavigationRequest = {
      ...request,
      id: `nav_${timestamp}${++idCounter}`,
      timestamp,
    };

    // Check for duplicates: same target section AND same source within threshold
    // But allow if priority is different (for testing purposes)
    const isDuplicate = state.requests.some(
      (r) =>
        r.targetSection === fullRequest.targetSection &&
        r.source === fullRequest.source &&
        r.priority === fullRequest.priority &&
        fullRequest.timestamp - r.timestamp < TIMING.DEDUPLICATION_THRESHOLD
    );

    if (isDuplicate) {
      console.log(`❌ Queue: Duplicate request for section ${fullRequest.targetSection} ignored.`);
      return null;
    }

    state.requests.push(fullRequest);
    return fullRequest;
  };

  const dequeue = (): NavigationRequest | null => {
    if (state.requests.length === 0) return null;
    const nextRequest = state.requests.shift()!;
    state.lastProcessedId = nextRequest.id;
    return nextRequest;
  };

  const clear = () => {
    state.requests = [];
    state.processing = false;
  };

  // Return object with getters to ensure state changes are reflected
  return {
    get requests() { return state.requests; },
    get processing() { return state.processing; },
    set processing(value: boolean) { state.processing = value; },
    get lastProcessedId() { return state.lastProcessedId; },
    enqueue,
    dequeue,
    clear,
  };
}
