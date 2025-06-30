# StoryScroller Critical Architecture Fixes

## 🚨 CRITICAL ISSUES TO FIX

### 1. State Drift Between Animation Systems
**Problem**: Lenis and GSAP have different ideas about scroll state
- Lenis shows `isAnimating: true` after GSAP says animation is complete
- `calculatedSection: 3, currentIndex: 4` mismatches in logs
- ScrollTrigger, Lenis, and our state can all disagree

**Root Cause**: Multiple animation controllers with no synchronization
- GSAP controls scrollTo animations
- Lenis controls smooth scroll physics
- Observer detects input
- ScrollTrigger tracks scroll position
- Our state tracks what we think is happening

**Fix Required**:
- Single animation controller that commands all others
- Force all systems to report to one source of truth
- Kill conflicting animations before starting new ones

### 2. No Animation Deduplication
**Problem**: Multiple scroll requests stack up causing chaos
- Rapid wheel events trigger multiple navigations
- External navigation fights with internal navigation
- Magnetic snap can trigger during other animations

**Evidence in Logs**:
```
🧭 gotoSection called: {requestedIndex: 3...}
🧭 gotoSection called: {requestedIndex: 3...}  // Duplicate!
```

**Fix Required**:
- Request queue with deduplication
- Timestamp-based filtering (ignore if same request within 100ms)
- State machine that knows what's already in progress

### 3. Hot Module Reload Breaking State
**Problem**: HMR fails with syntax errors, leaves corrupted state
- `[hmr] Failed to reload ...StoryScroller.tsx`
- Development experience is broken
- State persists across reloads incorrectly

**Fix Required**:
- Proper cleanup in useEffect/useGSAP
- Reset all animation state on unmount
- Guard against partial initialization

### 4. Missing Force Sync / Emergency Reset
**Problem**: No way to recover from corrupted state
- If animation gets stuck, it stays stuck
- No "panic button" to reset everything
- Cleanup only happens on full unmount

**Fix Required**:
- `forceSync()` method that aligns all systems to current truth
- `emergency()` method that kills everything and resets to section 0
- Periodic state verification (every 500ms) to detect drift

## 📋 IMPLEMENTATION PLAN

### Phase 1: Create Centralized Scroll Manager (useScrollManager)
**Location**: `/packages/story-scroller/src/hooks/useScrollManager.ts`

**Responsibilities**:
1. **Own ALL scroll state** (single source of truth)
   ```typescript
   interface ScrollState {
     currentSection: number
     targetSection: number | null
     isAnimating: boolean
     canNavigate: boolean
     scrollPosition: number
     velocity: number
     lastNavigationTime: number
   }
   ```

2. **Control ALL animation systems**:
   - Initialize and own Lenis instance
   - Create and manage GSAP animations
   - Setup Observer for input detection
   - Configure ScrollTrigger proxy

3. **Implement deduplication**:
   ```typescript
   const navigationQueue = {
     targetSection: number | null
     timestamp: number
     requestId: string
   }
   ```

4. **Provide unified API**:
   ```typescript
   interface ScrollManagerAPI {
     gotoSection: (index: number) => void
     nextSection: () => void
     prevSection: () => void
     forceSync: () => void      // Align all systems
     emergency: () => void       // Nuclear reset
     getState: () => ScrollState
     destroy: () => void
   }
   ```

### Phase 2: Extract from Current StoryScroller
**Current State**: StoryScroller.tsx has ~750 lines doing everything

**Extract These Sections**:
1. Lines 161-192: Lenis initialization → Move to useScrollManager
2. Lines 193-235: Lenis scroll event handling → Move to useScrollManager
3. Lines 293-430: gotoSection logic → Move to useScrollManager
4. Lines 440-500: Velocity tracking → Move to useScrollManager
5. Lines 502-600: Observer setup → Move to useScrollManager

**What Stays in StoryScroller**:
- Render logic only
- Use the scroll manager hook
- Handle context integration
- Keyboard event listeners (but delegate to manager)

### Phase 3: Implement State Verification
**Add Periodic Checks**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const state = getState()
    
    // Check for drift
    if (state.isAnimating && !hasActiveAnimation()) {
      console.warn('Animation stuck, forcing sync')
      forceSync()
    }
    
    // Check scroll position matches state
    const actualSection = Math.round(window.scrollY / window.innerHeight)
    if (actualSection !== state.currentSection && !state.isAnimating) {
      console.warn('Position drift detected')
      forceSync()
    }
  }, 500)
  
  return () => clearInterval(interval)
}, [])
```

### Phase 4: Add Deduplication Logic
**Before Any Navigation**:
```typescript
function gotoSection(index: number) {
  const now = Date.now()
  const state = getState()
  
  // Dedup: Same target within 100ms
  if (navigationQueue.targetSection === index && 
      now - navigationQueue.timestamp < 100) {
    return // Ignore duplicate
  }
  
  // Already there
  if (index === state.currentSection && !state.isAnimating) {
    return // No-op
  }
  
  // Currently animating to same target
  if (state.targetSection === index) {
    return // Already going there
  }
  
  // Lock and proceed
  navigationQueue = { targetSection: index, timestamp: now }
  // ... rest of navigation
}
```

### Phase 5: Implement Force Sync
**When Things Go Wrong**:
```typescript
function forceSync() {
  // 1. Kill all animations
  gsap.killTweensOf(window)
  if (lenisInstance) lenisInstance.stop()
  
  // 2. Determine truth (current scroll position)
  const actualSection = Math.round(window.scrollY / window.innerHeight)
  
  // 3. Force all systems to this truth
  setState({ 
    currentSection: actualSection,
    targetSection: null,
    isAnimating: false,
    canNavigate: true
  })
  
  // 4. Update scroll position if needed
  const targetY = actualSection * window.innerHeight
  if (Math.abs(window.scrollY - targetY) > 10) {
    window.scrollTo(0, targetY)
  }
  
  // 5. Refresh all controllers
  ScrollTrigger.refresh()
  if (lenisInstance) lenisInstance.scrollTo(targetY, { immediate: true })
}
```

### Phase 6: Emergency Reset
**Nuclear Option**:
```typescript
function emergency() {
  // 1. Destroy everything
  gsap.killTweensOf('*')
  ScrollTrigger.killAll()
  if (observer) observer.kill()
  if (lenisInstance) lenisInstance.destroy()
  
  // 2. Reset to beginning
  window.scrollTo(0, 0)
  
  // 3. Clear all state
  setState({
    currentSection: 0,
    targetSection: null,
    isAnimating: false,
    canNavigate: true,
    scrollPosition: 0,
    velocity: 0
  })
  
  // 4. Reinitialize
  initialize()
}
```

## 🧪 TESTING REQUIREMENTS

### 1. Deduplication Tests
- Rapid fire wheel events (10 events in 100ms)
- Simultaneous navigation from multiple sources
- Navigation during ongoing animation

### 2. State Drift Tests
- Force misalignment between GSAP and scroll position
- Interrupt animation midway
- Rapid back-and-forth navigation

### 3. Recovery Tests
- Trigger forceSync during animation
- Emergency reset during complex state
- HMR with active animations

### 4. Edge Cases
- Navigate to current section
- Navigate beyond bounds (section -1, section 999)
- Navigation with no sections
- Unmount during animation

## 📅 PRIORITY ORDER

1. **IMMEDIATE**: Create useScrollManager with deduplication (fixes duplicate nav)
2. **URGENT**: Implement forceSync (fixes state drift)
3. **HIGH**: Extract logic from StoryScroller (fixes architecture)
4. **MEDIUM**: Add state verification loop (catches drift early)
5. **LOW**: Polish physics/magnetic effects (only after core is solid)

## ⚠️ CONSTRAINTS

- Must maintain backward compatibility with existing API
- Cannot break the demo app during refactor
- Must work with React 18 Strict Mode
- Must handle Next.js SSR properly
- Keep all paranoid workarounds (Mac trackpad, etc)

## 🎯 SUCCESS CRITERIA

1. **No state drift**: All systems agree on current section always
2. **No duplicate animations**: One navigation request = one animation
3. **Recoverable**: Can always escape corrupted state
4. **Predictable**: Logs show clear cause → effect
5. **Testable**: Can unit test the scroll manager independently

## 🚫 WHAT NOT TO DO

- Don't add more features until core is fixed
- Don't trust "complete" callbacks without verification
- Don't allow multiple animation systems to fight
- Don't ignore deduplication
- Don't ship without emergency reset