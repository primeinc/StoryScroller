# BrowserService Integration Guide

This document shows how to integrate the BrowserService abstraction layer into the StoryScroller component for improved testability.

## Current Issues

The StoryScroller component currently has hard dependencies on browser globals:
- `window.scrollTo()`
- `window.scrollY`
- `window.innerWidth/innerHeight`
- `window.addEventListener()`
- `document.querySelector()`
- `navigator.userAgent`

These make the component difficult to test in isolation.

## Integration Example

### 1. Update Component Props

```typescript
interface StoryScrollerProps {
  // ... existing props
  browserService?: IBrowserService
}
```

### 2. Create Service Instance

```typescript
export const StoryScroller: React.FC<StoryScrollerProps> = ({
  // ... other props
  browserService = createBrowserService(),
}) => {
  // Component logic
}
```

### 3. Replace Direct Browser API Usage

Replace these patterns:

```typescript
// Before:
window.scrollTo(0, 0)
window.scrollY
window.innerWidth
document.querySelector(selector)
window.addEventListener('keydown', handler)

// After:
browserService.scrollTo(0, 0)
browserService.getScrollY()
browserService.getInnerWidth()
browserService.querySelector(selector)
browserService.addEventListener('keydown', handler)
```

### 4. Example Refactoring

Here's how to refactor the route change handler:

```typescript
// Before:
useEffect(() => {
  if (!state.isClient) return
  
  const handleRouteChange = () => {
    window.scrollTo(0, 0)
    ScrollTrigger.refresh(true)
    dispatch(scrollActions.resetScrollState())
  }
  
  window.addEventListener('popstate', handleRouteChange)
  return () => {
    window.removeEventListener('popstate', handleRouteChange)
  }
}, [state.pathname, state.isClient])

// After:
useEffect(() => {
  if (!browserService.isClient()) return
  
  const handleRouteChange = () => {
    browserService.scrollTo(0, 0)
    ScrollTrigger.refresh(true)
    dispatch(scrollActions.resetScrollState())
  }
  
  browserService.addEventListener('popstate', handleRouteChange)
  return () => {
    browserService.removeEventListener('popstate', handleRouteChange)
  }
}, [state.pathname, browserService])
```

## Testing Benefits

With the BrowserService, you can now write comprehensive tests:

```typescript
describe('StoryScroller', () => {
  it('should handle scroll navigation', () => {
    const mockBrowser = new MockBrowserService()
    const onSectionChange = vi.fn()
    
    render(
      <StoryScroller 
        sections={[<div>1</div>, <div>2</div>, <div>3</div>]}
        onSectionChange={onSectionChange}
        browserService={mockBrowser}
      />
    )
    
    // Simulate scroll down
    mockBrowser.triggerEvent('wheel', { deltaY: 100 })
    
    // Verify scroll animation
    expect(mockBrowser.getScrollHistory()).toHaveLength(1)
    expect(onSectionChange).toHaveBeenCalledWith(1)
  })
  
  it('should handle viewport resize', () => {
    const mockBrowser = new MockBrowserService()
    
    render(
      <StoryScroller 
        sections={[<div>1</div>]}
        browserService={mockBrowser}
      />
    )
    
    // Simulate mobile viewport
    mockBrowser.setViewportDimensions(375, 667)
    mockBrowser.triggerEvent('resize')
    
    // Component should adapt to mobile viewport
    // ... assertions
  })
})
```

## Migration Strategy

1. **Phase 1**: Add BrowserService as optional prop (backward compatible)
2. **Phase 2**: Gradually replace direct browser API calls
3. **Phase 3**: Add comprehensive tests using MockBrowserService
4. **Phase 4**: Make BrowserService required (breaking change)

## GSAP-Specific Considerations

Some GSAP methods still need direct browser access. For these cases:

1. Keep GSAP's internal browser detection
2. Use BrowserService for component-level logic
3. Pass DOM elements directly to GSAP (not selectors)

Example:
```typescript
// Instead of GSAP finding elements:
gsap.to('.section', { ... })

// Get element via BrowserService, then pass to GSAP:
const element = browserService.querySelector('.section')
if (element) {
  gsap.to(element, { ... })
}
```

## Next Steps

1. Create a branch for the refactoring
2. Update StoryScroller component incrementally
3. Add tests for each refactored section
4. Update demo app to show testing capabilities
5. Document breaking changes if making BrowserService required