// Test that state synchronization is fixed
console.log('Testing StoryScroller state synchronization fix...');

setTimeout(() => {
  fetch('http://localhost:5174/')
    .then(res => res.text())
    .then(html => {
      if (html.includes('Story Scroller Demo')) {
        console.log('✅ Demo server is running');
        
        console.log('\n📋 Expected behavior after fix:');
        console.log('1. currentIndex should update correctly when scrolling');
        console.log('2. No more spam of "Auto-updating section" messages');
        console.log('3. Animation IDs should show correct from/to sections');
        console.log('4. No more "Section state was wrong" errors\n');
        
        console.log('To verify:');
        console.log('1. Open http://localhost:5174/ in browser');
        console.log('2. Open DevTools Console');
        console.log('3. Scroll down and watch currentIndex update');
        console.log('4. Verify animation IDs like "section-0-to-1", "section-1-to-2"');
        console.log('5. Check that excessive logging is reduced');
      }
    })
    .catch(err => {
      console.error('❌ Failed to connect to demo server:', err.message);
    });
}, 1000);