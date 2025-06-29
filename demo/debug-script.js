// Debug script to inspect StoryScroller behavior
// This script should be run in the browser console

function debugStoryScroller() {
  console.log('=== StoryScroller Debug Report ===');
  
  // 1. Check if all sections are present in DOM
  console.log('\n1. DOM Structure Analysis:');
  const sections = document.querySelectorAll('[data-section-idx]');
  console.log(`Found ${sections.length} sections in DOM`);
  
  sections.forEach((section, i) => {
    const idx = section.getAttribute('data-section-idx');
    const rect = section.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(section);
    
    console.log(`Section ${idx}:`, {
      element: section,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom
      },
      styles: {
        position: computedStyle.position,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        zIndex: computedStyle.zIndex,
        transform: computedStyle.transform,
        height: computedStyle.height,
        overflow: computedStyle.overflow
      },
      isVisible: rect.top >= 0 && rect.top < window.innerHeight
    });
  });
  
  // 2. Check container styles
  console.log('\n2. Container Analysis:');
  const container = document.querySelector('.story-scroller-container');
  if (container) {
    const containerRect = container.getBoundingClientRect();
    const containerStyle = window.getComputedStyle(container);
    console.log('Container:', {
      element: container,
      rect: containerRect,
      styles: {
        height: containerStyle.height,
        width: containerStyle.width,
        overflow: containerStyle.overflow,
        position: containerStyle.position
      }
    });
  }
  
  // 3. Check scroll position
  console.log('\n3. Scroll State:');
  console.log({
    windowScrollY: window.scrollY,
    documentScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
    windowHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight
  });
  
  // 4. Check GSAP and Lenis
  console.log('\n4. Library Status:');
  console.log({
    gsapExists: typeof gsap !== 'undefined',
    lenisExists: typeof Lenis !== 'undefined',
    scrollTriggerExists: typeof ScrollTrigger !== 'undefined'
  });
  
  // 5. Check navigation state
  console.log('\n5. Navigation State:');
  const navButtons = document.querySelectorAll('.demo-nav button');
  const dots = document.querySelectorAll('.demo-nav-dot');
  console.log({
    navButtons: Array.from(navButtons).map(btn => ({
      text: btn.textContent,
      disabled: btn.disabled
    })),
    activeDot: Array.from(dots).findIndex(dot => dot.classList.contains('active')),
    totalDots: dots.length
  });
  
  return {
    sections: sections.length,
    container: !!container,
    scrollY: window.scrollY
  };
}

// Function to test navigation
function testNavigation() {
  console.log('\n=== Testing Navigation ===');
  
  const nextBtn = document.querySelector('.demo-nav button:last-of-type');
  const prevBtn = document.querySelector('.demo-nav button:first-of-type');
  const dots = document.querySelectorAll('.demo-nav-dot');
  
  console.log('Navigation elements:', {
    nextButton: !!nextBtn,
    prevButton: !!prevBtn,
    dots: dots.length
  });
  
  // Test clicking next button
  if (nextBtn && !nextBtn.disabled) {
    console.log('Clicking next button...');
    nextBtn.click();
    
    setTimeout(() => {
      console.log('After next click - scroll position:', window.scrollY);
      debugStoryScroller();
    }, 100);
  }
}

// Function to monitor scroll events
function monitorScrollEvents() {
  console.log('\n=== Monitoring Scroll Events ===');
  
  let scrollCount = 0;
  const originalScrollTo = window.scrollTo;
  
  window.scrollTo = function(...args) {
    scrollCount++;
    console.log(`scrollTo called (${scrollCount}):`, args);
    return originalScrollTo.apply(this, args);
  };
  
  window.addEventListener('scroll', () => {
    console.log('Scroll event - position:', window.scrollY);
  });
  
  console.log('Scroll monitoring active. Try navigating...');
}

// Auto-run initial debug
if (typeof window !== 'undefined') {
  console.log('StoryScroller Debug Script Loaded');
  console.log('Run debugStoryScroller() to analyze current state');
  console.log('Run testNavigation() to test navigation');
  console.log('Run monitorScrollEvents() to monitor scroll behavior');
  
  // Auto-run after a short delay to let everything load
  setTimeout(() => {
    debugStoryScroller();
  }, 1000);
}