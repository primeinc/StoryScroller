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

// Internal types for StoryScroller implementation

// Lenis scroll event data
export interface LenisScrollEvent {
  scroll: number      // Current scroll position
  limit: number       // Maximum scroll limit
  velocity: number    // Scroll velocity
  direction: number   // Scroll direction (1 for down, -1 for up)
  progress: number    // Scroll progress (0-1)
}

// Lenis virtual scroll event data
export interface LenisVirtualScrollEvent {
  deltaX: number
  deltaY: number
  event: WheelEvent | TouchEvent
}

// Lenis instance interface
export interface LenisInstance {
  scroll: number
  raf: (time: number) => void
  scrollTo: (value: number, options?: { immediate?: boolean }) => void
  on: {
    (event: 'scroll', callback: (data: LenisScrollEvent) => void): () => void
    (event: 'virtual-scroll', callback: (data: LenisVirtualScrollEvent) => void): () => void
  }
  destroy: () => void
}

export interface ObserverInstance {
  kill: () => void
}

export interface ObserverConfig {
  target: Window | HTMLElement
  type: string
  tolerance: number
  preventDefault: boolean
  wheelSpeed: number
  onDown?: () => void
  onUp?: () => void
  onWheel?: (self: { deltaY: number }) => void
}