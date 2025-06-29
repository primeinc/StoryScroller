// Simple test to verify useDebouncing integration
console.log('Testing StoryScroller with useDebouncing integration...');

// Wait for server to be ready
setTimeout(() => {
  fetch('http://localhost:5174/')
    .then(res => res.text())
    .then(html => {
      if (html.includes('Story Scroller Demo')) {
        console.log('✅ Demo server is running');
        
        // Check console output by opening browser
        console.log('\n📋 To verify integration:');
        console.log('1. Open http://localhost:5174/ in browser');
        console.log('2. Open DevTools Console');
        console.log('3. Look for "🎯 StoryScroller" logs from useDebouncing');
        console.log('4. Try scrolling and verify debouncing works');
        console.log('5. Check that rapid scrolls are blocked\n');
        
        console.log('Expected logs:');
        console.log('- "🎯 StoryScroller canNavigate:" (from useDebouncing)');
        console.log('- "🎯 StoryScroller Animation started:" (when navigating)');
        console.log('- "🎯 StoryScroller Animation ended:" (after animation)');
      } else {
        console.error('❌ Demo server not responding correctly');
      }
    })
    .catch(err => {
      console.error('❌ Failed to connect to demo server:', err.message);
    });
}, 1000);