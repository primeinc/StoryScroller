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