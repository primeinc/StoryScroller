// Test if the simplified React component renders
async function testSimpleRender() {
  try {
    console.log('Testing simplified React component...');
    
    // Wait a moment for the dev server to compile
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch the page again
    const response = await fetch('http://localhost:5174/');
    const html = await response.text();
    
    console.log('=== SIMPLE COMPONENT TEST ===');
    console.log('HTML length:', html.length);
    console.log('Still empty root?', html.includes('<div id="root"></div>'));
    
    if (html.includes('<div id="root"></div>')) {
      console.log('\n❌ ISSUE FOUND: React is not rendering at all!');
      console.log('This suggests a fundamental problem with:');
      console.log('- React/ReactDOM imports');
      console.log('- JavaScript compilation');
      console.log('- Vite configuration');
      console.log('- TypeScript configuration');
    } else {
      console.log('\n✅ React is rendering - the issue was with StoryScroller imports');
    }
    
  } catch (error) {
    console.error('Error testing simple render:', error);
  }
}

testSimpleRender();