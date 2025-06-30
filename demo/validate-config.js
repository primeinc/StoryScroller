/**
 * Configuration System Validation Script
 * 
 * Run this in the browser console to verify the configuration system
 * works end-to-end and actually affects scroll behavior.
 */

console.log('🔧 StoryScroller Configuration Validation Starting...');

// Test 1: API Existence
console.log('\n📋 Test 1: API Existence');
const api = window.storyScrollerAPI;
console.log('✓ StoryScroller API exists:', !!api);
console.log('✓ updateConfig method exists:', !!api?.updateConfig);
console.log('✓ getState method exists:', !!api?.getState);

if (!api || !api.updateConfig) {
  console.error('❌ FAILED: API or updateConfig missing');
  throw new Error('Configuration API not available');
}

// Test 2: Initial State
console.log('\n📋 Test 2: Initial State');
const initialState = api.getState();
console.log('✓ Initial state:', initialState);
console.log('✓ Current section:', initialState.currentSection);

// Test 3: Configuration Update
console.log('\n📋 Test 3: Configuration Update');
const testConfig = {
  duration: 2.5,  // Much slower than default 1.2s
  tolerance: 30,  // Different from default 50
  enableMagneticSnap: false  // Disable snapping
};

console.log('✓ Applying test configuration:', testConfig);
api.updateConfig(testConfig);
console.log('✓ Configuration applied successfully');

// Test 4: Behavioral Validation
console.log('\n📋 Test 4: Behavioral Test');
console.log('🧪 Testing navigation with new slower duration...');

const startTime = performance.now();
let navigationComplete = false;

// Listen for state changes to measure duration
const checkDuration = () => {
  const currentState = api.getState();
  if (currentState.currentSection !== initialState.currentSection && !navigationComplete) {
    const endTime = performance.now();
    const actualDuration = (endTime - startTime) / 1000;
    navigationComplete = true;
    
    console.log(`✓ Navigation completed in ${actualDuration.toFixed(2)}s`);
    console.log(`✓ Expected ~2.5s, got ${actualDuration.toFixed(2)}s`);
    
    if (actualDuration > 2.0 && actualDuration < 3.5) {
      console.log('✅ SUCCESS: Configuration change affected behavior!');
    } else {
      console.log('⚠️  WARNING: Duration may not have changed as expected');
    }
    
    // Reset to default config
    console.log('\n🔄 Resetting to default configuration...');
    api.updateConfig({
      duration: 1.2,
      tolerance: 50,
      enableMagneticSnap: true
    });
    console.log('✓ Reset complete');
  }
};

// Start monitoring
const monitorInterval = setInterval(checkDuration, 100);

// Trigger navigation
console.log('🚀 Triggering navigation to test new duration...');
api.nextSection();

// Cleanup after 5 seconds
setTimeout(() => {
  clearInterval(monitorInterval);
  if (!navigationComplete) {
    console.log('⚠️  Test incomplete - manual verification needed');
  }
  console.log('\n🎉 Configuration validation complete!');
}, 5000);

console.log('\n💡 Manual Test Instructions:');
console.log('1. Open the ControlHub (click ⚙️ button)');
console.log('2. Click to expand to standard mode');  
console.log('3. Click again to access advanced mode');
console.log('4. Go to Configuration tab');
console.log('5. Adjust duration slider');
console.log('6. Click "Apply Changes"');
console.log('7. Test navigation - should be slower/faster');