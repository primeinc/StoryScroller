import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Import and register GSAP plugins at app level
import { gsap } from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin.js'
import ScrollTrigger from 'gsap/ScrollTrigger.js'
import Observer from 'gsap/Observer.js'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer)

// Make plugins globally available
;(window as any).gsap = gsap
window.ScrollTrigger = ScrollTrigger
window.Observer = Observer

console.log('🔌 [main.tsx] GSAP plugins registered:', {
  ScrollToPlugin: !!(gsap as any).plugins?.scrollTo,
  ScrollTrigger: !!window.ScrollTrigger,
  Observer: !!window.Observer,
  gsapPlugins: Object.keys((gsap as any).plugins || {}),
  windowGsap: !!(window as any).gsap
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)