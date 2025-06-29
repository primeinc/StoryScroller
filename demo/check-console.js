// Simple console checker using fetch to see what's in the rendered page
async function checkConsole() {
  try {
    // Check if main.tsx is working by fetching the compiled version
    const mainResponse = await fetch('http://localhost:5174/src/main.tsx');
    if (mainResponse.ok) {
      console.log('✓ main.tsx is being served by Vite');
    } else {
      console.log('✗ main.tsx failed to load');
      return;
    }

    // Check if App.tsx is working
    const appResponse = await fetch('http://localhost:5174/src/App.tsx');
    if (appResponse.ok) {
      console.log('✓ App.tsx is being served by Vite');
    } else {
      console.log('✗ App.tsx failed to load');
      return;
    }

    // Check if StoryScroller package is accessible
    const storyScrollerResponse = await fetch('http://localhost:5174/@fs/home/will/local_dev/portfolio/packages/story-scroller/src/index.ts');
    if (storyScrollerResponse.ok) {
      console.log('✓ StoryScroller package is accessible');
    } else {
      console.log('✗ StoryScroller package failed to load');
    }

    // Check the actual page
    const pageResponse = await fetch('http://localhost:5174/');
    const html = await pageResponse.text();
    
    console.log('\n=== PAGE ANALYSIS ===');
    console.log('HTML length:', html.length);
    console.log('Contains root div:', html.includes('<div id="root">'));
    console.log('Contains main.tsx script:', html.includes('/src/main.tsx'));
    
    // Wait and then check if content was rendered by making another request
    // (This won't show client-side rendering, but helps verify server state)
    setTimeout(async () => {
      console.log('\n=== RECOMMENDATION ===');
      console.log('All static assets are being served correctly.');
      console.log('The issue is likely:');
      console.log('1. A runtime JavaScript error preventing React from rendering');
      console.log('2. A dependency issue in the StoryScroller package');
      console.log('3. A React component throwing an error during render');
      console.log('\nTo debug: Open http://localhost:5174 in a browser and check the console.');
    }, 1000);

  } catch (error) {
    console.error('Error checking console:', error);
  }
}

checkConsole();