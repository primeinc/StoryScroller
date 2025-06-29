
import type { NavigationRequest, AnimationQueue } from '../types/scroll-manager';
import { TIMING } from '../constants/scroll-physics';

/** Creates and returns a new animation queue instance. */
export function createAnimationQueue(): AnimationQueue {
  let requests: NavigationRequest[] = [];
  let processing = false;
  let lastProcessedId: string | null = null;

  const enqueue = (request: Omit<NavigationRequest, 'id' | 'timestamp'>): NavigationRequest | null => {
    const fullRequest: NavigationRequest = {
      ...request,
      id: `nav_${Date.now()}`,
      timestamp: Date.now(),
    };

    const isDuplicate = requests.some(
      (r) =>
        r.targetSection === fullRequest.targetSection &&
        fullRequest.timestamp - r.timestamp < TIMING.DEDUPLICATION_THRESHOLD
    );

    if (isDuplicate) {
      console.log(`❌ Queue: Duplicate request for section ${fullRequest.targetSection} ignored.`);
      return null;
    }

    requests.push(fullRequest);
    return fullRequest;
  };

  const dequeue = (): NavigationRequest | null => {
    if (requests.length === 0) return null;
    const nextRequest = requests.shift()!;
    lastProcessedId = nextRequest.id;
    return nextRequest;
  };

  const clear = () => {
    if (requests.length > 0) {
      requests = [];
    }
    processing = false;
  };

  return { requests, processing, lastProcessedId, enqueue, dequeue, clear };
}
