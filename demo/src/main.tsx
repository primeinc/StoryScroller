import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import and register GSAP plugins at app level
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger, Observer)

// Make plugins globally available
window.gsap = gsap
window.ScrollTrigger = ScrollTrigger
window.Observer = Observer

console.log('🔌 [main.tsx] GSAP plugins registered:', {
  ScrollToPlugin: !!gsap.plugins.scrollTo,
  ScrollTrigger: !!window.ScrollTrigger,
  Observer: !!window.Observer,
  gsapPlugins: Object.keys(gsap.plugins || {}),
  windowGsap: !!window.gsap
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)