/**
 * Browser Service abstraction layer for testability and SSR compatibility.
 * Removes hard dependencies on window/document objects.
 */

/**
 * Interface defining all browser API methods needed by StoryScroller.
 * This enables dependency injection and testability.
 */
export interface IBrowserService {
  // Scroll operations
  scrollTo(x: number, y: number, options?: ScrollToOptions): void
  getScrollY(): number
  getScrollX(): number
  
  // Event handling
  addEventListener(event: string, handler: EventListener, options?: boolean | AddEventListenerOptions): void
  removeEventListener(event: string, handler: EventListener, options?: boolean | EventListenerOptions): void
  
  // DOM measurements
  getBoundingClientRect(element: Element): DOMRect
  getViewportDimensions(): { width: number; height: number }
  
  // Animation
  requestAnimationFrame(callback: FrameRequestCallback): number
  cancelAnimationFrame(id: number): void
  
  // DOM queries
  querySelector<T extends Element = Element>(selector: string): T | null
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T>
  
  // Environment checks
  isClient(): boolean
  
  // Navigation
  getUserAgent(): string
  
  // Document properties
  getDocumentBody(): HTMLElement | null
  getDocumentElement(): HTMLElement | null
  
  // Window properties
  getInnerWidth(): number
  getInnerHeight(): number
  getWindow(): Window | undefined
  
  // Custom events for testing
  dispatchEvent(event: Event): boolean
}

/**
 * Production implementation of IBrowserService.
 * Uses actual browser APIs when available.
 */
export class BrowserService implements IBrowserService {
  private _window: Window | undefined
  private _document: Document | undefined
  
  constructor() {
    this._window = typeof window !== 'undefined' ? window : undefined
    this._document = typeof document !== 'undefined' ? document : undefined
  }
  
  scrollTo(x: number, y: number, options?: ScrollToOptions): void {
    if (this._window) {
      if (options) {
        this._window.scrollTo({ left: x, top: y, ...options })
      } else {
        this._window.scrollTo(x, y)
      }
    }
  }
  
  getScrollY(): number {
    return this._window?.scrollY ?? 0
  }
  
  getScrollX(): number {
    return this._window?.scrollX ?? 0
  }
  
  addEventListener(event: string, handler: EventListener, options?: boolean | AddEventListenerOptions): void {
    if (this._window) {
      this._window.addEventListener(event, handler, options)
    }
  }
  
  removeEventListener(event: string, handler: EventListener, options?: boolean | EventListenerOptions): void {
    if (this._window) {
      this._window.removeEventListener(event, handler, options)
    }
  }
  
  getBoundingClientRect(element: Element): DOMRect {
    return element.getBoundingClientRect()
  }
  
  getViewportDimensions(): { width: number; height: number } {
    return {
      width: this._window?.innerWidth ?? 0,
      height: this._window?.innerHeight ?? 0,
    }
  }
  
  requestAnimationFrame(callback: FrameRequestCallback): number {
    if (this._window?.requestAnimationFrame) {
      return this._window.requestAnimationFrame(callback)
    }
    // Fallback for non-browser environments
    return setTimeout(() => callback(Date.now()), 16) as unknown as number
  }
  
  cancelAnimationFrame(id: number): void {
    if (this._window?.cancelAnimationFrame) {
      this._window.cancelAnimationFrame(id)
    } else {
      clearTimeout(id)
    }
  }
  
  querySelector<T extends Element = Element>(selector: string): T | null {
    return this._document?.querySelector<T>(selector) ?? null
  }
  
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    return this._document?.querySelectorAll<T>(selector) ?? ([] as unknown as NodeListOf<T>)
  }
  
  isClient(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }
  
  getUserAgent(): string {
    return this._window?.navigator?.userAgent ?? ''
  }
  
  getDocumentBody(): HTMLElement | null {
    return this._document?.body ?? null
  }
  
  getDocumentElement(): HTMLElement | null {
    return this._document?.documentElement ?? null
  }
  
  getInnerWidth(): number {
    return this._window?.innerWidth ?? 0
  }
  
  getInnerHeight(): number {
    return this._window?.innerHeight ?? 0
  }
  
  getWindow(): Window | undefined {
    return this._window
  }
  
  dispatchEvent(event: Event): boolean {
    if (this._window) {
      return this._window.dispatchEvent(event)
    }
    return false
  }
}

/**
 * Mock implementation of IBrowserService for testing.
 * Provides controllable behavior and state tracking.
 */
export class MockBrowserService implements IBrowserService {
  private _scrollX = 0
  private _scrollY = 0
  private _innerWidth = 1024
  private _innerHeight = 768
  private _userAgent = 'Mozilla/5.0 (Testing) MockBrowser/1.0'
  private _isClient = true
  private _eventListeners: Map<string, Set<EventListener>> = new Map()
  private _rafCallbacks: Map<number, FrameRequestCallback> = new Map()
  private _rafId = 0
  private _elements: Map<string, MockElement> = new Map()
  private _scrollHistory: Array<{ x: number; y: number; timestamp: number }> = []
  
  // Test helpers
  public readonly events = {
    dispatched: [] as Event[],
    listeners: this._eventListeners,
  }
  
  scrollTo(x: number, y: number, _options?: ScrollToOptions): void {
    this._scrollX = x
    this._scrollY = y
    this._scrollHistory.push({ x, y, timestamp: Date.now() })
    
    // Simulate scroll event
    const scrollEvent = new Event('scroll')
    this.dispatchEvent(scrollEvent)
  }
  
  getScrollY(): number {
    return this._scrollY
  }
  
  getScrollX(): number {
    return this._scrollX
  }
  
  addEventListener(event: string, handler: EventListener, _options?: boolean | AddEventListenerOptions): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set())
    }
    this._eventListeners.get(event)!.add(handler)
  }
  
  removeEventListener(event: string, handler: EventListener, _options?: boolean | EventListenerOptions): void {
    this._eventListeners.get(event)?.delete(handler)
  }
  
  getBoundingClientRect(element: Element): DOMRect {
    // Return mock rect for testing
    const mockElement = element as unknown as MockElement
    return mockElement._mockRect ?? new DOMRect(0, 0, 100, 100)
  }
  
  getViewportDimensions(): { width: number; height: number } {
    return {
      width: this._innerWidth,
      height: this._innerHeight,
    }
  }
  
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = ++this._rafId
    this._rafCallbacks.set(id, callback)
    return id
  }
  
  cancelAnimationFrame(id: number): void {
    this._rafCallbacks.delete(id)
  }
  
  querySelector<T extends Element = Element>(selector: string): T | null {
    return (this._elements.get(selector) as unknown as T) ?? null
  }
  
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    const elements: T[] = []
    this._elements.forEach((element, key) => {
      if (key.startsWith(selector)) {
        elements.push(element as unknown as T)
      }
    })
    return elements as unknown as NodeListOf<T>
  }
  
  isClient(): boolean {
    return this._isClient
  }
  
  getUserAgent(): string {
    return this._userAgent
  }
  
  getDocumentBody(): HTMLElement | null {
    return this._isClient ? ({} as HTMLElement) : null
  }
  
  getDocumentElement(): HTMLElement | null {
    return this._isClient ? ({} as HTMLElement) : null
  }
  
  getInnerWidth(): number {
    return this._innerWidth
  }
  
  getInnerHeight(): number {
    return this._innerHeight
  }
  
  getWindow(): Window | undefined {
    return this._isClient ? ({} as Window) : undefined
  }
  
  dispatchEvent(event: Event): boolean {
    this.events.dispatched.push(event)
    const listeners = this._eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        listener(event)
      })
    }
    return true
  }
  
  // Test utility methods
  setScrollPosition(x: number, y: number): void {
    this._scrollX = x
    this._scrollY = y
  }
  
  setViewportDimensions(width: number, height: number): void {
    this._innerWidth = width
    this._innerHeight = height
  }
  
  setUserAgent(userAgent: string): void {
    this._userAgent = userAgent
  }
  
  setIsClient(isClient: boolean): void {
    this._isClient = isClient
  }
  
  addMockElement(selector: string, rect?: DOMRect): MockElement {
    const element = new MockElement(rect)
    this._elements.set(selector, element)
    return element
  }
  
  getScrollHistory(): Array<{ x: number; y: number; timestamp: number }> {
    return [...this._scrollHistory]
  }
  
  clearScrollHistory(): void {
    this._scrollHistory = []
  }
  
  triggerRAF(time: number = Date.now()): void {
    const callbacks = Array.from(this._rafCallbacks.values())
    this._rafCallbacks.clear()
    callbacks.forEach(callback => callback(time))
  }
  
  triggerEvent(eventType: string, eventInit?: EventInit): void {
    const event = new Event(eventType, eventInit)
    this.dispatchEvent(event)
  }
  
  reset(): void {
    this._scrollX = 0
    this._scrollY = 0
    this._innerWidth = 1024
    this._innerHeight = 768
    this._userAgent = 'Mozilla/5.0 (Testing) MockBrowser/1.0'
    this._isClient = true
    this._eventListeners.clear()
    this._rafCallbacks.clear()
    this._rafId = 0
    this._elements.clear()
    this._scrollHistory = []
    this.events.dispatched = []
  }
}

/**
 * Mock element class for testing
 */
class MockElement {
  _mockRect: DOMRect
  
  constructor(rect?: DOMRect) {
    this._mockRect = rect ?? new DOMRect(0, 0, 100, 100)
  }
  
  getBoundingClientRect(): DOMRect {
    return this._mockRect
  }
}

/**
 * Factory function to create browser service based on environment
 */
export function createBrowserService(mock = false): IBrowserService {
  return mock ? new MockBrowserService() : new BrowserService()
}