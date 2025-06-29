````markdown
// components/StoryScroller/types.d.ts
/\*\*

- @fileoverview Type definitions for the StoryScroller component and related scroll system.
  \*/

/\*\*

- Represents a section in the StoryScroller.
- Each section is expected to be a ReactNode (e.g., a JSX element).
  \*/
  export type StorySection = React.ReactNode;

/\*\*

- Props for the StoryScroller component.
  \*/
  export interface StoryScrollerProps {
  /\*\*

  - An array of React nodes, where each node represents a full-viewport section.
  - The component will snap between these sections.
  - @example
  - ```tsx

    ```

  - <StoryScroller sections={[<div>Section 1</div>, <div>Section 2</div>]} />
  - ```
       */
      sections: StorySection[];
    }
    ```
````

````markdown
// components/StoryScroller/StoryScroller.tsx
/\*\*

- @fileoverview Implements a production-grade, paranoid section-snapping scroll system for React/Next.js
- using GSAP (ScrollTrigger, Observer, ScrollToPlugin) and Lenis for smooth scrolling.
- This component is designed with robust workarounds for common production pitfalls.
-
- @see README.md for comprehensive documentation, architecture overview, and setup instructions.
- @see DESIGN_NOTES.md for detailed engineering rationale, known bugs, and "war stories" behind workarounds.
  \*/

"use client"; // CRITICAL: Marks this component as a Client Component for Next.js.
// Any component interacting with browser-specific APIs (window, document) must be a client component.
// Failure to do so will result in SSR errors (`ReferenceError: window is not defined`) during server-side rendering.

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger, ScrollToPlugin, Observer } from "gsap/all"; // GSAP plugins for scroll control.
import { useGSAP } from "@gsap/react"; // Official GSAP React hook for automatic cleanup.

// DANGER: Dynamic import for Lenis to prevent SSR issues.
// Lenis directly accesses `window` and `document` which are not available on the server.
const initLenis = async () => {
const Lenis = (await import('lenis')).default;
return Lenis;
};

// DANGER ZONE: PLUGIN REGISTRATION
// This MUST be done once at the module level, NOT inside the component.
// GSAP's `registerPlugin` is idempotent (safe to call multiple times), but placing it
// inside a React component is a sloppy practice that can cause unnecessary
// recalculations during hot-reloading in a Next.js development environment.
// It signals a misunderstanding of React's render lifecycle.
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer);

import type { StoryScrollerProps } from './types'; // Importing types for strict typing.

/\*\*

- StoryScroller component creates a full-page section-snapping experience.
- It combines Lenis for smooth scroll physics with GSAP for precise control over snapping and animations.
-
- @param {StoryScrollerProps} props - The properties for the component.
- @returns {JSX.Element} The rendered scrollable component with snap-to sections.
-
- @example
- ```tsx

  ```

- // In your page component (e.g., app/page.tsx)
- import { StoryScroller } from '../components/StoryScroller/StoryScroller';
-
- export default function HomePage() {
- const sections = [
-     <div key="s1" style={{ background: 'lightblue', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
-       <h1>Section One</h1>
-     </div>,
-     <div key="s2" style={{ background: 'lightcoral', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
-       <h1>Section Two</h1>
-     </div>,
-     <div key="s3" style={{ background: 'lightgreen', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
-       <h1>Section Three</h1>
-     </div>,
- ];
-
- return <StoryScroller sections={sections} />;
- }
- ```

  ```

- @see DESIGN_NOTES.md#section-snapping-implementation-rationale
- @see README.md#quickstart-usage
  \*/
  export const StoryScroller: React.FC<StoryScrollerProps> = ({ sections }) => {
  /\*\*
  - @property {React.RefObject<HTMLDivElement>} container - Ref to the main scrolling container element.
  - Used for scoping GSAP selectors and ensuring `getBoundingClientRect` calculations are accurate.
    \*/
    const container = useRef<HTMLDivElement>(null);

/\*\*

- @property {React.MutableRefObject<number>} idx - Ref to hold the current active section index.
- Using `useRef` avoids triggering unnecessary component re-renders on change,
- as the index is primarily for internal animation logic.
- If the index needed to drive external UI (e.g., a navigation component or URL hash),
- this state would need to be lifted into React state (`useState`) and potentially a shared context.
  \*/
  const idx = useRef<number>(0);

/\*\*

- @property {React.MutableRefObject<boolean>} isAnimating - Critical state flag to prevent event handler pile-up,
- especially from momentum-scrolling devices like Mac trackpads.
- This flag debounces user input by preventing new animations while one is already in progress.
- @see DESIGN_NOTES.md#mac-trackpad-nightmare
  \*/
  const isAnimating = useRef<boolean>(false);

/\*\*

- @property {React.MutableRefObject<number>} lastScrollTime - Timestamp to help debounce rapid scroll events,
- particularly for Mac trackpad momentum issues.
- @see DESIGN_NOTES.md#mac-trackpad-nightmare
  \*/
  const lastScrollTime = useRef<number>(0);

/\*\*

- @property {boolean} isClient - State to track if the component has mounted on the client-side.
- Used as a guard for client-only logic to prevent premature execution in SSR.
  \*/
  const [isClient, setIsClient] = useState<boolean>(false);

/\*\*

- @property {React.MutableRefObject<number>} mountCountRef - Hack to detect actual client mount vs. React 18 StrictMode double mount.
- In development, StrictMode intentionally mounts, unmounts, and remounts components immediately to
- surface bugs related to improper side-effect cleanup. This ref helps differentiate.
  \*/
  const mountCountRef = useRef<number>(0);

/\*\*

- Effect to set `isClient` state after the initial (and StrictMode double) mount.
- This ensures client-specific code runs only when `window` and `document` are available.
  \*/
  useEffect(() => {
  mountCountRef.current += 1;
  setIsClient(true);
  }, []);

/\*\*

- The core operational logic of the scroll system.
- Encapsulated within `useGSAP` to leverage its automatic cleanup via `gsap.context()`.
- This is our primary defense against memory leaks and conflicting animations, especially in React 18's Strict Mode.
-
- @param {GSAPContext} context - The GSAP context provided by `useGSAP`.
- @param {HTMLElement} scope - The DOM element scoped by `useGSAP` (our `container` ref).
- @param {any[]} dependencies - React dependencies that trigger re-execution of this hook.
-
- @see README.md#centralized-animation-management
- @see DESIGN_NOTES.md#react-18-strictmode-the-double-edge-sword
  \*/
  useGSAP(() => {
  if (!isClient) return; // Guard to ensure client-side execution.

  /\*\*

  - Asynchronous function to set up the scroll system.
  - This allows for dynamic import of Lenis and handles potential errors during initialization.
  - @async
  - @function setupScroll
  - @private
    \*/
    const setupScroll = async () => {
    let lenisInstance: Awaited<ReturnType<typeof initLenis>> | null = null;
    let checkScrollEndInterval: NodeJS.Timeout | undefined;
    let rafId: number | undefined;


      try {
        const Lenis = await initLenis(); // Dynamically import Lenis.

        // 1. SMOOTH SCROLL: Lenis Initialization & GSAP Ticker Synchronization
        // WHAT BREAKS HERE? If you instantiate Lenis but forget to destroy it on
        // cleanup, React's Strict Mode will create a second, "ghost" Lenis instance
        // on remount. You'll have two libraries fighting for control of the scroll,
        // causing extreme jank and memory leaks.
        //
        // WHO COMPLAINS ABOUT THIS? Countless forum posts on GSAP and Reddit show
        // developers fighting jank because they have two competing animation loops:
        // one from Lenis (its internal rAF) and one from GSAP (its ticker).
        //
        // WHAT'S THE WORKAROUND? The only robust solution is to establish a single
        // source of truth for the animation loop. We disable Lenis's internal loop
        // (`autoRaf: false` is the default when instantiating manually) and drive it
        // using GSAP's more powerful ticker. This ensures perfect synchronization.
        lenisInstance = new Lenis({
          duration: 1.2, // Duration of the smooth scroll animation.
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing for smooth feel.
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          smoothTouch: false, // CRITICAL: Prevents mobile conflicts and accidental scrolling.
          touchMultiplier: 2,
          infinite: false,
          autoResize: true, // HACK: Helps with Firefox throttling issues.
        });

        // WORKAROUND: Custom RAF to avoid GSAP ticker issues and ensure Lenis is driven.
        // Lenis requires time in milliseconds. GSAP's ticker provides it in seconds.
        // The multiplication by 1000 is non-negotiable for correct timing.
        const raf = (time: DOMHighResTimeStamp) => {
          lenisInstance?.raf(time);
          rafId = requestAnimationFrame(raf); // Recursively call RAF for continuous update.
        };
        rafId = requestAnimationFrame(raf);

        // CRITICAL: Sync Lenis scroll events with ScrollTrigger updates.
        // Without this, ScrollTrigger’s pinned elements or start/end markers can
        // desync and cause jitter.
        lenisInstance.on('scroll', (e: any) => {
          ScrollTrigger.update();
          // HACK: Track scroll state for Mac trackpad momentum issue.
          isScrolling.current = true;
          lastScrollTime.current = Date.now();
        });

        // WORKAROUND: Mac trackpad momentum debouncing.
        // Apple trackpads continue emitting wheel events after release due to momentum,
        // causing animations to trigger multiple times from a single flick.
        checkScrollEndInterval = setInterval(() => {
          if (Date.now() - lastScrollTime.current > 150) { // If no scroll event for 150ms, assume scroll ended.
            isAnimating.current = false; // Reset `isAnimating` flag to allow next scroll.
            isScrolling.current = false;
          }
        }, 100);

        // HACK: Delay ScrollTrigger initialization to avoid Next.js hydration errors.
        // ScrollTrigger modifies body style during initialization, causing "Warning: Extra attributes from the server: style".
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            // Configure ScrollTrigger AFTER hydration.
            ScrollTrigger.config({
              syncInterval: 40, // WORKAROUND: Reduces position drift.
              autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
            });

            // Set up ScrollTrigger scroller proxy to use Lenis.
            ScrollTrigger.scrollerProxy(document.body, {
              scrollTop(value) {
                if (arguments.length) {
                  lenisInstance?.scrollTo(value, { immediate: true });
                }
                return lenisInstance?.scroll || 0;
              },
              getBoundingClientRect() {
                return {
                  top: 0,
                  left: 0,
                  width: window.innerWidth,
                  height: window.innerHeight
                };
              }
            });
            ScrollTrigger.refresh(true); // Force refresh after setup.
          }, 100); // HACK: 100ms delay for Next.js hydration.
        }

        // 2. SECTION SNAPPING: GSAP Observer Implementation
        // WHAT BREAKS HERE? The Apple Magic Mouse and MacBook trackpads. They have
        // a momentum feature that continues to fire "wheel" events for a short period
        // after the user has stopped physically interacting with the device.
        // If our `goto` animation is shorter than this momentum period, the residual
        // events will trigger another navigation, causing an infuriating "double snap".
        //
        // WHO COMPLAINS ABOUT THIS? The GSAP forums are filled with reports of this
        // "double fire" behavior. It is the single most common
        // hardware-related failure mode for Observer-based navigation.
        const observer = Observer.create({
          target: window, // Observe the entire window for scroll events.
          type: "wheel,touch", // Listen for mouse wheel and touch gestures.
          tolerance: 50, // WORKAROUND: Higher tolerance for trackpads.
          // This value dictates how much wheel/touch movement is required before an event is fired.
          // A value of 10-15 (or up to 50 for extreme cases) provides a good buffer against
          // accidental micro-movements from momentum.
          preventDefault: true, // CRITICAL: Disables default browser scroll behavior.
          // DANGER: This can have accessibility consequences, potentially breaking
          // keyboard navigation (arrow keys, spacebar). Rigorous testing with
          // screen readers and keyboard-only navigation is required.
          wheelSpeed: -1, // Adjust wheel speed. Use -1 to invert scroll direction if needed.
          // HACK: Debounced callbacks for Mac trackpad.
          onDown: () => {
            // Only trigger if not already animating AND enough time has passed since last scroll event.
            if (isAnimating.current) return;
            if (Date.now() - lastScrollTime.current < 200) return; // Prevent rapid re-triggering.
            gotoSection(idx.current + 1);
          },
          onUp: () => {
            if (isAnimating.current) return;
            if (Date.now() - lastScrollTime.current < 200) return;
            gotoSection(idx.current - 1);
          },
          // WORKAROUND: Firefox throttling with Logitech Mice.
          // On Firefox, proper mouse wheels (Logitech) experience throttling/lagging with GSAP Observer,
          // while Apple mice work fine.
          onWheel: (self) => {
            const isFirefox = navigator.userAgent.includes('Firefox');
            if (isFirefox && Math.abs(self.deltaY) < 50) {
              self.deltaY *= 2; // Boost small movements on Firefox to counter throttling.
            }
          }
        });

        /**
         * Navigates to a specific section index with a smooth scroll animation.
         *
         * @function gotoSection
         * @param {number} index - The target section index.
         * @returns {void}
         * @private
         *
         * @see DESIGN_NOTES.md#goto-function-logic
         */
        const gotoSection = context.contextSafe((index: number) => { // Using contextSafe for event handlers.
          // Guard against multiple simultaneous animations.
          if (isAnimating.current) return;

          // Clamp the index to valid bounds. `gsap.utils.clamp` is a robust helper for this.
          const newIndex = gsap.utils.clamp(0, sections.length - 1, index);

          // If the index hasn't changed, do nothing.
          if (newIndex === idx.current) return;

          isAnimating.current = true;
          idx.current = newIndex;

          // WHAT BREAKS HERE? Using `element.offsetTop`. This is a trap.
          // `offsetTop` calculates position relative to the nearest positioned ancestor (`offsetParent`) and,
          // critically, it is completely unaware of CSS transforms applied to any element in the hierarchy.
          // If a parent container has `transform: scale(0.9)` or `transform: translateY(50px)`, `offsetTop`
          // will return a value from the pre-transform layout, causing the scroll
          // animation to land in the wrong place.
          //
          // WHO COMPLAINS ABOUT THIS? Developers building complex, dynamic layouts.
          // In any modern component-based architecture, assuming no transforms exist
          // in the parent tree is dangerously naive.
          //
          // WHAT'S THE WORKAROUND? `element.getBoundingClientRect()`.
          // This method returns the element's position *as it is currently rendered in the viewport*,
          // accounting for all CSS transforms, flexbox/grid layouts, etc..
          // However, its `.top` property is relative to the viewport, not the document.
          // The GSAP ScrollToPlugin needs a value relative to the top of the entire
          // scrollable document. The only robust formula is to combine the viewport-relative
          // position with the current scroll offset.
          const sectionEl = container.current?.querySelector<HTMLElement>(`[data-section-idx='${idx.current}']`);
          if (!sectionEl) {
            console.warn(`StoryScroller: Section with index ${idx.current} not found.`);
            isAnimating.current = false;
            return;
          }

          const targetY = sectionEl.getBoundingClientRect().top + window.scrollY;

          // Smooth scroll to target using GSAP ScrollToPlugin.
          gsap.to(window, {
            scrollTo: {
              y: targetY,
              autoKill: false, // IMPORTANT: Prevents user scroll attempts from immediately canceling our programmatic scroll animation.
            },
            duration: 1.2,
            ease: "power2.inOut",
            onComplete: () => {
              isAnimating.current = false;
            },
          });
        });

      } catch (error) {
        console.error('Scroll system initialization failed:', error);
      }

      // 4. THE CLEANUP IMPERATIVE: This is non-negotiable for stability.
      // This return function is executed by `useGSAP` when the component unmounts.
      // In React 18 Strict Mode, this happens *immediately* after the first mount.
      // If any of these steps are missed, you will have orphaned event listeners,
      // conflicting animation tickers, and memory leaks.
      return () => {
        // Clear interval for scroll end detection.
        if (checkScrollEndInterval) {
          clearInterval(checkScrollEndInterval);
        }
        // Cancel requestAnimationFrame loop.
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        // 1. Kill the Observer. If we don't, the `wheel` and `touch` event listeners
        //    it attached to the window will persist, firing callbacks that reference
        //    a component that no longer exists.
        observer?.kill();

        // 2. Destroy the Lenis instance. This method properly removes all internal
        //    event listeners and cleans up its state.
        lenisInstance?.destroy();

        // 3. Kill all ScrollTrigger instances (if any were created outside of useGSAP context,
        // or as a paranoid fallback).
        // This is important for routes changes in Next.js App Router.
        ScrollTrigger.killAll();

        // PARANOID: Clear all GSAP animations globally.
        // This is a nuclear option for route changes or complex unmounts.
        gsap.killTweensOf("*");
      };

  };

  setupScroll();

}, [isClient, sections.length]); // Dependency array: Re-run if client state changes or number of sections changes.

// WORKAROUND: Handle route changes in Next.js App Router.
// Ensures scroll position is reset and ScrollTriggers are refreshed.
useEffect(() => {
const handleRouteChange = () => {
// Nuclear option for route changes: scroll to top immediately.
if (typeof window !== 'undefined') {
window.scrollTo(0, 0); // Directly scroll window to top for consistency.
}
ScrollTrigger.refresh(true); // Force ScrollTrigger to re-evaluate positions.
};

    // Listen to Next.js route changes (popstate fires on back/forward navigation).
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange);
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }

}, []);

// HACK: Suppress hydration warnings for ScrollTrigger's body styles in Next.js.
// This is a last resort to remove ScrollTrigger's injected inline styles from the body
// before Next.js performs its hydration check, then restores them.
// Not recommended as a primary solution, but necessary in some fragile cases.
useEffect(() => {
if (typeof document !== 'undefined') {
const bodyStyle = document.body.getAttribute('style');
if (bodyStyle && bodyStyle.includes('overflow')) {
document.body.removeAttribute('style');
requestAnimationFrame(() => {
if (bodyStyle) { // Ensure bodyStyle is not null before restoring.
document.body.setAttribute('style', bodyStyle);
}
});
}
}
}, []);

// JSX & CSS FALLBACKS
return (

<div
ref={container}
className="scroll-container-fallback" // Apply fallback CSS class.
style={{
        height: "100vh",
        width: "100vw",
        // This `overflow: "hidden"` on the container is a common pattern for
        // scroll-jacking, but it's Lenis that actually enables the scrolling.
        // The real scroll happens on the `<body>` element via `scrollerProxy`.
        overflow: "hidden",
        overscrollBehavior: 'none', // HACK: iOS bounce prevention.
        minHeight: '100vh', // WORKAROUND: Height issues.
        height: '100%',
      }} >
{sections.map((child, i) => (
<section
key={i}
data-section-idx={i} // Custom attribute for easy selection by `gotoSection`.
tabIndex={0} // Make focusable for keyboard navigation fallback.
className="scroll-section-fallback" // Apply fallback CSS class.
style={{
            height: "100vh",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            scrollSnapAlign: "start", // CSS fallback: align each section to top on snap.
            outline: "none" // Remove default focus outline (app can style it manually).
          }} >
{child}
</section>
))}
</div>
);
};
````

`````markdown
// components/StoryScroller/README.md
/\*\*

- @fileoverview README documentation for the StoryScroller component.
- Provides a comprehensive overview of the system, its architecture, usage, and known issues.
  \*/

# StoryScroller: A Production-Ready React+GSAP Scroll-Snapping System

## Background & Context

The `StoryScroller` component provides a **resilient and performant section-snapping scroll system** for modern React and Next.js applications. Building such a system is challenging due to complex interactions between browser events, hardware eccentricities, and React's lifecycle. This system is designed to be lean, using a combination of specialized, best-in-class tools rather than a monolithic framework.

The objective is not to find a perfect solution—none exists—but to choose the combination with the most understood and manageable failure modes. This component is the result of extensive research into common production pitfalls, aiming to anticipate and mitigate known failure modes (e.g., Mac trackpad momentum, Next.js hydration errors, memory leaks).

## Architecture Overview

The `StoryScroller` component is built on a "paranoid" engineering philosophy, integrating the following core components:

- **Lenis**: A lightweight smooth scroll engine. It normalizes user inputs (trackpad, mouse wheel) and provides a "flawless" smooth experience.
- **GreenSock Animation Platform (GSAP)**:
  - **Observer**: Detects wheel, touch, and pointer events for low-level scroll control.
  - **ScrollToPlugin**: Animates scroll position programmatically.
  - **ScrollTrigger**: Orchestrates scroll-based animations (used indirectly via `scrollerProxy` for Lenis synchronization).
- **@gsap/react (useGSAP hook)**: A purpose-built React hook that automatically manages the cleanup of all GSAP instances created within its scope using `gsap.context()`. This is **mandatory** for stability in React 18's Strict Mode, which performs double-invocations of effects in development.

The system ensures **single source of truth** for the animation loop by making GSAP's ticker drive Lenis, preventing conflicting `requestAnimationFrame` loops that cause jank.

## Consensus vs. Controversy Table

This table summarizes key engineering decisions and workarounds, highlighting where sources agree or offer different perspectives.

| Aspect | Consensus | Divergence/Controversy & Rationale Test your scrolling with a real physical device.

- Check for browser extensions conflicts.
- Verify your cleanup functions for GSAP and Lenis.
- Ensure Next.js client component directive `“use client”` is present.
- Check for proper synchronization between Lenis and ScrollTrigger.
- Look for `offsetTop` usage and replace with `getBoundingClientRect()`.
- Inspect memory usage for potential leaks.
- Review your `tolerance` values for GSAP Observer.
- Ensure `isAnimating` or similar state flags are correctly implemented for debouncing.
- Check if `preventDefault: true` is causing accessibility issues.

## Quickstart & Usage

To integrate the `StoryScroller` into your Next.js application:

1.  **Place the files:**
    Copy `types.d.ts`, `StoryScroller.tsx`, `README.md`, `DESIGN_NOTES.md` into a directory like `components/StoryScroller/`.
2.  **Add `styles.css`:**
    Ensure the CSS styles for the fallbacks (from `DESIGN_NOTES.md#css-fallbacks`) are available globally in your application, e.g., in `globals.css` or similar.
3.  **Install dependencies:**
    ```bash
    pnpm add react gsap lenis @gsap/react
    pnpm add -D @types/gsap @types/react
    ```
4.  **Import and use in a Client Component:**
    Your page or parent component **must** be a Client Component (`"use client";`) if it imports `StoryScroller.tsx`.

    ```tsx
    // app/page.tsx (or any other client component)
    'use client'

    import { StoryScroller } from '../components/StoryScroller/StoryScroller'

    export default function HomePage() {
      const sections = [
        <div
          key="s1"
          style={{
            background: 'lightblue',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1>Welcome to Section One!</h1>
        </div>,
        <div
          key="s2"
          style={{
            background: 'lightcoral',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h2>Discover Section Two.</h2>
        </div>,
        <div
          key="s3"
          style={{
            background: 'lightgreen',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h3>Explore Section Three.</h3>
        </div>,
      ]

      return <StoryScroller sections={sections} />
    }
    ```

## Accessibility, Performance, and Test Caveats

Building a custom scroll system introduces significant trade-offs and risks that must be carefully managed.

### Accessibility Considerations

- **Scroll Hijacking Impact**: Custom scroll solutions inherently "hijack" native browser scroll behavior (`preventDefault: true`), which can severely impact accessibility.
- **Keyboard Navigation**: Standard keyboard scrolling (arrow keys, spacebar, Page Up/Down) will be disabled. The component includes `tabIndex={0}` on sections to make them focusable, allowing keyboard users to navigate via the Tab key.
- **CSS Fallback**: `scroll-snap-type: proximity` is used as a safer CSS fallback to `mandatory`. If `mandatory` were used and content exceeded `100vh`, users could be trapped, unable to scroll. `proximity` allows snapping but doesn't prevent free scrolling.
- **Screen Reader Testing**: Continuous testing with screen readers (e.g., VoiceOver, NVDA) is crucial to verify content is announced in logical order and that `preventDefault` doesn't create unforeseen barriers.

### Performance Trade-offs

- **JavaScript Overhead**: JavaScript-driven scroll libraries, while enabling advanced effects, introduce overhead not present with native scrolling. This can lead to reduced frame rates and increased memory usage, especially on less powerful devices.
- **Memory Usage**: Combining Lenis, ScrollTrigger, and Observer can significantly increase memory footprint (e.g., +40-60MB with Observer, +60-100MB with pinning). Mobile Safari performance, in particular, can be poor (15-30fps).
- **Mobile Performance**: Smooth scroll libraries often tank mobile performance. Native scroll is 3-5x faster. This system acknowledges this trade-off, prioritizing the specific aesthetic.
- **Testing Performance**: Emulators and browser developer tools may not accurately reflect real device performance. **Always test on real, hostile hardware**.

### Testing Strategies

- **Focus on Outcomes**: Unit tests should assert the _result_ of an animation (e.g., element visibility, state change) rather than pixel-perfect intermediate animation states.
- **Mock Timing**: Globally force animations to finish immediately in test environments by setting GSAP tween durations to zero or mocking GSAP methods to instantly apply final states. Jest's fake timers can fast-forward `setTimeout` calls.
- **`prefers-reduced-motion`**: For E2E tests (e.g., Playwright), emulate the `prefers-reduced-motion: reduce` media query. Implement global CSS or JS checks to cut animation durations to 0ms when this preference is active. This significantly speeds up E2E tests by avoiding waits for animations.
- **Cleanup Validation**: Ensure components properly clean up listeners and tweens on unmount. The `useGSAP` hook handles GSAP instances automatically, but other listeners (e.g., from Lenis, Observer) require manual cleanup.

## Living Danger List

This system, while robustly designed, is not infallible. A paranoid engineer remains vigilant to external threats and future changes that could compromise its stability.

- **Dependency Drift**: Future major versions of GSAP (e.g., 4.0), Lenis (e.g., 2.0), or `@gsap/react` could introduce breaking API changes. Pinning dependency versions provides short-term stability but accumulates technical debt. Constant vigilance on changelogs is required.
- **Next.js and React Evolution**: New React lifecycle behaviors (e.g., React 19 causing `useGSAP` contexts to revert animations unexpectedly) or changes in the Next.js App Router's server/client component model could introduce unexpected bugs.
- **OS and Browser Updates**: OS-level features like Mac trackpad momentum or browser implementations of `getBoundingClientRect` or event handling could change, invalidating current workarounds. Firefox/Logitech mouse throttling is a known example.
- **Layout Fragility and Upstream DOM Changes**: The `gotoSection` function relies on a predictable DOM structure. Refactoring that introduces new parent containers with transforms could break position calculations. Sticky headers/footers also require offsets. `ResizeObserver` or `window` resize events might be needed for dynamic layouts.
- **Third-Party Interference**: Other scripts or browser extensions (e.g., Grammarly, ColorZilla, LastPass, AdBlock) can interfere with scroll or DOM manipulation, leading to unpredictable results. Only one scroll-control mechanism should be active.
- **Accessibility Blind Spot**: Despite foundational accessibility features, scroll-jacking is inherently risky. Continuous testing with screen readers and keyboard-only users is an ongoing process.

## References

- **Mac Trackpad Momentum**: [https://gsap.com/community/forums/topic/40308-observer-issue-with-macbook-trackpad/](https://gsap.com/community/forums/topic/40308-observer-issue-with-macbook-trackpad/)
- **Mac Trackpad Solutions**: [https://gsap.com/community/forums/topic/42626-problem-with-touchpad-scrolling-behavior-in-observer-plugin/](https://gsap.com/community/forums/topic/42626-problem-with-touchpad-scrolling-behavior-in-observer-plugin/)
- **React StrictMode Double Mount**: [https://legacy.reactjs.org/docs/strict-mode.html](https://legacy.reactjs.org/docs/strict-mode.html)
- **React StrictMode Cleanup**: [https://www.zipy.ai/blog/understanding-react-useeffect-cleanup-function](https://www.zipy.ai/blog/understanding-react-useeffect-cleanup-function)
- **GSAP Ticker Performance Issues**: [https://gsap.com/community/forums/topic/28734-gsaptickeradd-causing-an-infinite-rendering-in-my-component/](https://gsap.com/community/forums/topic/28734-gsaptickeradd-causing-an-infinite-rendering-in-my-component/)
- **Lenis GitHub**: [https://github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis)
- **Lenis Docs**: [https://lenis.darkroom.engineering/](https://lenis.darkroom.engineering/)
- **Lenis GSAP Sync Issues (Reddit)**: [https://www.reddit.com/r/reactjs/comments/1ip54fz/problem_setting_up_lenis_and_gsap_in_react/](https://www.reddit.com/r/reactjs/comments/1ip54fz/problem_setting_up_lenis_and_gsap_in_react/)
- **GSAP React Hook**: [https://gsap.com/resources/React/](https://gsap.com/resources/React/)
- **GSAP Context Growth**: [https://gsap.com/community/forums/topic/44044-usegsap-context-continually-grows-but-why/](https://gsap.com/community/forums/topic/44044-usegsap-context-continually-grows-but-why/)
- **Next.js Hydration Issues**: [https://www.omi.me/blogs/next-js-errors/error-ssr-encountered-an-unexpected-error-in-next-js-causes-and-how-to-fix](https://www.omi.me/blogs/next-js-errors/error-ssr-encountered-an-unexpected-error-in-next-js-causes-and-how-to-fix)
- **`getBoundingClientRect` vs `offsetTop`**: [https://medium.com/@alexcambose/js-offsettop-property-is-not-great-and-here-is-why-b79842ef7582](https://medium.com/@alexcambose/js-offsettop-property-is-not-great-and-here-is-why-b79842ef7582)
- **`scroll-snap-type: mandatory` warning (MDN)**: [https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap/Basic_concepts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap/Basic_concepts)
- **Firefox Logitech Mouse Lag**: [https://github.com/darkroomengineering/lenis/issues/311](https://github.com/darkroomengineering/lenis/issues/311)
- **Mobile ScrollTrigger Issues**: [https://gsap.com/community/forums/topic/41466-gsap-not-working-on-mobile-with-scroll-trigger/](https://gsap.com/community/forums/topic/41466-gsap-not-working-on-mobile-with-scroll-trigger/)
- **`autoKill: false` for `scrollTo`**: [https://stackoverflow.com/questions/35119749/js-preventdefault-for-user-scrolling-or-force-gsap-scrolling-over-user](https://stackoverflow.com/questions/35119749/js-preventdefault-for-user-scrolling-or-force-gsap-scrolling-over-user)

````markdown
// components/StoryScroller/DESIGN_NOTES.md
/\*\*

- @fileoverview Deeper engineering rationale and "war stories" behind the StoryScroller component.
- This document provides context for the design decisions and workarounds implemented.
-
- @see StoryScroller.tsx for the component implementation.
- @see README.md for a high-level overview and usage.
  \*/

# StoryScroller: Design Notes & Paranoid Engineering Commentary

This document serves as a "field manual" or an engineering diary, detailing the specific problems encountered during the development of this scroll system and the "paranoid" solutions devised to address them. Every major decision and workaround in `StoryScroller.tsx` is annotated here with its real-world problem, the source of the complaint (often forum threads or GitHub issues), and the rationale behind the chosen mitigation.

## 1. Core Component Selection (Revisited)

The selection of Lenis, GSAP, and `@gsap/react` was adversarial. Other alternatives like `locomotive-scroll v5` and `fullpage.js` were decisively rejected.

- **Locomotive Scroll v5**: Was a candidate due to being rebuilt on Lenis. However, it's definitively **not production-ready**. GitHub issues from 2024 showed critical bugs:

  - **Next.js Instability**: "jumps and bottom cutoff".
  - **SSR Failures**: `ReferenceError: window is not defined`. This signals a fragile architecture that doesn't safely handle server-side rendering.
  - **Architectural Flaws**: `_init()` method hardcodes `window` and `document.documentElement` for scroll wrapper, making custom container scrolling impossible.
  - **Widespread Bugs**: Broken mobile layouts, incorrect height calculations, conflicts, TypeScript errors.
  - _Conclusion_: An unacceptable level of risk for a production system.

- **fullpage.js**: Offered a turnkey solution but proved to be a "wrapper trap".
  - **Licensing**: GPLv3, making it legally problematic for most closed-source commercial projects without purchasing a commercial license.
  - **Integration Fragility**: Persistent issues in React wrapper: crashes on page reload, inability to scroll outside wrapper in Next.js, state conflicts preventing re-renders, `fullpage_api` not available.
  - _Conclusion_: A monolithic black box that prioritizes simplistic API over robust, composable architecture, antithetical to our design philosophy.

## 2. The Unholy Trinity of Production Failures & Workarounds

While the `README.md` outlines the issues, this section dives deeper into the "why" and "how" of their mitigation.

### 2.1. Next.js Hydration Mismatch (`setTimeout` Gambit / `suppressHydrationWarning` Surrender)

**The Problem**: GSAP's ScrollTrigger, upon initialization, often manipulates the `<body>` element's inline styles (e.g., `overflow` properties) to accurately calculate bounds for animations. When Next.js performs hydration, it compares the server-rendered HTML (which doesn't have these styles) with the client-side DOM (which does), leading to "Warning: Extra attributes from the server: style" or full hydration errors. This is a fundamental conflict between an imperative DOM-manipulating library and a declarative SSR framework.

**War Story**: Developers frequently resort to extreme measures, including disabling browser extensions (Grammarly, ColorZilla), using incognito mode, or resorting to `suppressHydrationWarning`. The Next.js team advises against suppressing warnings, while the GSAP team states these calculations are necessary.

**Workarounds Implemented in Code**:

- **Delayed Initialization (`setTimeout`)**: We delay the `ScrollTrigger.config()` and `ScrollTrigger.scrollerProxy()` setup by 100ms using `setTimeout`. This is a fragile hack relying on winning a race condition, hoping hydration completes before GSAP attempts its DOM modifications.
- **Post-Hydration Style Removal/Restore**: The `useEffect` block that checks for `document.body.getAttribute('style')` is a desperate measure. It attempts to remove ScrollTrigger's inline styles _before_ React's hydration check, then restores them _after_ hydration. This silences the warning but doesn't fix the underlying architectural conflict.

### 2.2. The Mac Trackpad's Unrelenting Momentum (Debouncing, `tolerance`, `overflow: hidden` Lock)

**The Problem**: Apple trackpads and Magic Mice continue to emit "wheel" events due to momentum _after_ the user has stopped physical interaction. If a snap animation completes faster than this residual momentum, another animation can be triggered, causing an infuriating "double-snap" or "triple-snap". There is **no perfect solution** for this; it's a hostile hardware reality.

**War Story**: GSAP forums are filled with reports of this "double fire" behavior. It's the most common hardware-related failure mode for Observer-based navigation.

**Workarounds Implemented in Code**:

- **`isAnimating` Flag**: A critical boolean ref (`isAnimating.current`) is set to `true` at the start of a `gotoSection` animation and `false` on `onComplete`. This creates a hard cooldown, effectively debouncing input and preventing new animations from firing while one is in progress.
- **`lastScrollTime` and `checkScrollEnd`**: A `setInterval` periodically checks if `Date.now() - lastScrollTime.current` exceeds a threshold (150ms). If so, it signifies the scroll momentum has likely ceased, and `isAnimating` is safely reset.
- **`Observer` `tolerance`**: The `tolerance` property on `Observer.create` is set to a high value (50). This dictates how much wheel/touch movement is required before an event fires. A higher value buffers against accidental micro-movements from momentum.
- **Firefox Throttling Workaround**: `onWheel` callback specifically targets Firefox with Logitech mice, boosting small delta movements to counteract throttling.

### 2.3. The Insidious Nature of Memory Leaks (Militant Cleanup, `contextSafe`, Pin Spacers)

**The Problem**: Even with React 18's Strict Mode and `useGSAP`, memory leaks are common if cleanup is not "militant". Orphaned event listeners, conflicting tickers, and detached DOM elements can accumulate, leading to performance degradation, "jank," and non-deterministic bugs.

**War Story**: Real production cases show `Tween` objects not being garbage collected, even after `null` assignment, leading to detached HTML elements. Community forums are littered with complaints about cumulative slowdowns due to forgotten cleanup.

**Workarounds Implemented in Code**:

- **`useGSAP` as Bastion**: Encapsulating all core logic in `useGSAP` ensures GSAP instances (tweens, ScrollTriggers created within its scope) are automatically reverted/cleaned up via `gsap.context()` on component unmount.
- **Explicit Non-GSAP Cleanup**: The `return` function of `useGSAP` is the "kill zone". We explicitly call `observer.kill()` and `lenisInstance.destroy()`. These objects attach global event listeners and manage internal state that `useGSAP` does _not_ automatically manage.
- **GSAP Ticker Removal**: The `gsap.ticker.remove(raf)` call is crucial. Forgetting this leads to multiple `requestAnimationFrame` loops running simultaneously, causing jank and CPU spikes.
- **`contextSafe()` for Callbacks**: Event listeners or animations created _inside_ GSAP callbacks (e.g., `onComplete`) can form closures that escape the `useGSAP` context, leading to leaks. Using `contextSafe()` (provided by `useGSAP`) wraps these functions, bringing them into the managed context.
- **`ScrollTrigger.killAll()` & `gsap.killTweensOf("*")`**: These are "nuclear options". `killAll()` is particularly useful for robust cleanup on route changes in Next.js, ensuring no stale ScrollTrigger instances remain. Killing all tweens globally is a paranoid last resort.
- **`pin-spacer` elements**: (Not directly addressed in `StoryScroller`'s core logic as it doesn't use pinning, but important context for `ScrollTrigger` users): ScrollTrigger's `pin: true` creates "pin-spacer" `<div>` elements. If ScrollTrigger instances are not properly killed, these spacers can be left in the DOM and held in memory, leading to leaks.

## 3. `getBoundingClientRect` vs. `offsetTop`

**The Problem**: Relying on `element.offsetTop` for calculating scroll targets. `offsetTop` is a relic that calculates position relative to an `offsetParent` and **does not account for modern CSS transforms** (e.g., `transform: translateY()`, `scale()`). This means if any parent element in the hierarchy has a transform, `offsetTop` will return an incorrect, pre-transform layout value, causing the scroll animation to land in the wrong place.

**War Story**: This is a common pitfall for developers building complex, dynamic layouts. Assuming no transforms exist in the parent tree is dangerously naive in modern component-based architectures.

**Workaround Implemented in Code**:

- `element.getBoundingClientRect().top + window.scrollY`. `getBoundingClientRect()` returns the element's position _as it is currently rendered in the viewport_, accounting for all CSS transforms and layouts. Adding `window.scrollY` converts this viewport-relative position to a document-relative one, which GSAP's `scrollTo` plugin expects.

## 4. CSS Fallbacks & `overscrollBehavior`

**The Problem**: A JavaScript-driven scroll experience should have a graceful fallback if JS fails or for users with `prefers-reduced-motion`. However, implementing CSS scroll-snap incorrectly (e.g., using `mandatory`) can lead to accessibility traps.

**Workarounds Implemented in Code**:

- **`scroll-snap-type: y proximity`**: Used on the main container. This is the **only safe, production-ready option**. It encourages snapping without "imprisoning" the user, allowing them to scroll past a section if its content overflows the viewport. Using `mandatory` would prevent users from seeing overflowing content.
- **`scroll-behavior: smooth`**: Provides a basic smooth scrolling experience as a fallback for browsers if Lenis fails or is not loaded.
- **`overscrollBehavior: 'none'`**: Applied to the container. This is a HACK to prevent the iOS "rubber-band" bounce effect that can interfere with custom scroll experiences.
- **Lenis Recommended CSS**: The `html.lenis`, `.lenis.lenis-smooth`, etc., classes are applied to ensure consistent behavior, especially for nested scroll areas and preventing layout shifts.

## 5. Next.js App Router Transitions

**The Problem**: With the Next.js App Router and client-side transitions, a fast page switch could unmount the `StoryScroller` component mid-scroll. A GSAP `scrollTo` tween might still be running when unmount happens, leading to orphaned animations or incorrect scroll positions on re-navigation.

**Workaround Implemented in Code**:

- **Route Change Listener (`popstate`)**: An `useEffect` listens for `popstate` events (which fire on browser back/forward navigation).
- **`window.scrollTo(0, 0)` and `ScrollTrigger.refresh(true)`**: On route change, the window is immediately scrolled to the top, and `ScrollTrigger` is forced to re-evaluate its positions. This is a "nuclear option" to reset scroll state and ensure consistency across page transitions.

This detailed log aims to provide future maintainers with the hard-won wisdom gained from building and debugging such a complex system. Staying vigilant and testing on real devices remain paramount.

```markdown
// styles.css
/\*\*

- @fileoverview Global CSS styles for the StoryScroller component.
- Provides fallback snapping behavior and Lenis-specific styling.
  \*/

/\*

- This provides a fallback snapping behavior if JavaScript/GSAP fails.
- DANGER: Do NOT use `scroll-snap-type: y mandatory;`.
- The MDN documentation explicitly warns that if any child section's content
- is taller than the viewport, `mandatory` will make it impossible for the
- user to scroll down to see the overflowing content, trapping them. This is
- a critical accessibility failure.
-
- `proximity` is the safer, production-ready choice. It will snap if the user
- stops scrolling "close enough" to a snap point but will not prevent them
- from freely scrolling to view overflowing content.
  _/
  .scroll-container-fallback {
  scroll-snap-type: y proximity;
  height: 100vh;
  overflow-y: scroll; /_ Ensure scrollbar is visible for fallback _/
  scroll-behavior: smooth; /_ Fallback smooth scrolling for browsers (not as good as Lenis) \*/
  }

.scroll-section-fallback {
scroll-snap-align: start; /_ Align each section to top on snap _/
height: 100vh; /_ Each section fills the viewport height _/
outline: none; /_ Remove default focus outline (app can style it manually for accessibility) _/
}

/\*

- Recommended CSS from Lenis docs. This helps prevent layout shifts and
- ensures consistent behavior, especially when using features like
- `data-lenis-prevent` for nested scroll areas.
  \*/
  html.lenis {
  height: auto;
  }

.lenis.lenis-smooth {
scroll-behavior: auto !important; /_ Override default smooth scroll when Lenis is active _/
}

.lenis.lenis-smooth [data-lenis-prevent] {
overscroll-behavior: contain; /_ Prevent native overscroll on elements where Lenis should not interfere _/
}

.lenis.lenis-stopped {
overflow: hidden; /_ Hide overflow when Lenis explicitly stops scrolling _/
}

.lenis.lenis-scrolling iframe {
pointer-events: none; /_ Prevent interaction with iframes during Lenis-driven scroll _/
}
```
````
`````

````

```markdown
// GLOSSARY.md
/\*\*

- @fileoverview Glossary of essential technical terms used in the StoryScroller documentation.
  \*/

# Glossary of Terms

- **GSAP (GreenSock Animation Platform)**: A powerful, high-performance JavaScript animation library used for creating complex, timeline-based animations and controlling DOM elements.
- **Lenis**: A lightweight, dependency-free JavaScript library designed to provide highly smooth and customizable scroll experiences, often used to override native browser scrolling.
- **Scroll-Jacking**: The practice of overriding the browser's default scroll behavior to implement custom scrolling effects, often for aesthetic or interactive purposes.
- **SSR (Server-Side Rendering)**: A technique where web pages are rendered on the server before being sent to the client's browser, improving initial load performance and SEO.
- **Hydration**: The process in React (and other SPA frameworks) where the client-side JavaScript takes over a server-rendered HTML page, attaching event listeners and making it interactive.
- **StrictMode (React 18)**: A development mode in React that helps identify potential problems in an application by intentionally invoking effects and other lifecycle methods twice. This highlights issues with improper cleanup.
- **Debounce**: A programming practice used to limit the rate at which a function is called, ensuring it only fires after a certain period has passed without further activity (e.g., after GSAP animations into React components by automatically handling cleanup and scope management.
- **`gsap.context()`**: A feature within GSAP that creates a self-contained scope for animations and instances, allowing them to be easily reverted or cleaned up together.
- **`getBoundingClientRect()`**: A DOM method that returns the size of an element and its position relative to the viewport, accounting for all CSS transforms and layout changes.
- **`offsetTop`**: A DOM property that returns the top position of an element relative to its `offsetParent`. It does not account for CSS transforms and can provide inaccurate results in modern layouts.
- **`tolerance` (GSAP Observer)**: A setting in the GSAP Observer plugin that defines how much movement (e.g., wheel delta) is required before an event is considered significant enough to trigger a callback. Used to filter out small, accidental movements.
- **`preventDefault: true`**: A property in event handlers or configurations that stops the browser's default action for a given event (e.g., stops native scrolling for a wheel event).
```
````
