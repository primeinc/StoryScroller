/**
 * Type declarations for GSAP plugin deep imports
 * GSAP plugins must be imported with .js extension in ESM, but don't ship with .d.ts files
 * GSAP plugins export as default exports, not named exports
 */

declare module 'gsap/ScrollTrigger.js' {
  import { ScrollTrigger } from 'gsap/types/scroll-trigger';
  const ScrollTriggerDefault: typeof ScrollTrigger;
  export default ScrollTriggerDefault;
}

declare module 'gsap/ScrollToPlugin.js' {
  import { ScrollToPlugin } from 'gsap/types/scroll-to-plugin';
  const ScrollToPluginDefault: typeof ScrollToPlugin;
  export default ScrollToPluginDefault;
}

declare module 'gsap/Observer.js' {
  import { Observer } from 'gsap/types/observer';
  const ObserverDefault: typeof Observer;
  export default ObserverDefault;
}