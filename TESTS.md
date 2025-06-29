# StoryScroller Testing Framework

## Philosophy

**Tests validate user experience, not implementation details.**

This framework uses Playwright to test what users actually experience: animation performance, input responsiveness, visual consistency, and cross-browser compatibility. Every test runs against the real demo in real browsers.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run with visible browser
pnpm test:headed

# Debug specific test
pnpm test:debug

# View test results
pnpm test:report
```

## Test Structure

```
package/
├── playwright.config.ts           # Multi-browser configuration
├── tests/
│   ├── base-test.ts               # Extended Playwright with logging & screenshots
│   ├── utils/
│   │   ├── test-logger.ts         # Console output → timestamped files
│   │   └── screenshot-manager.ts  # Strategic visual documentation
│   ├── functional/
│   │   └── scroll-performance.test.ts # Real performance validation
│   └── template-example.test.ts   # Copy this for new tests
```

## Key Features

### **Complete Console Logging**
Every browser message is captured with timestamps:
- JavaScript errors and warnings
- Page crashes and network failures  
- Performance measurements
- Test step progression
- Final summary statistics

**Log files:** `test-results/logs/test-name-timestamp.log`

### **Strategic Screenshots**
Visual documentation at key moments:
- **Baseline**: Initial state before any actions
- **Steps**: Progress after each major action
- **Failures**: Full page context when tests fail
- **Mobile**: Responsive behavior across viewports
- **Accessibility**: High contrast mode validation
- **Performance**: Animation sequences frame-by-frame

**Screenshots:** `test-results/screenshots/test-name/`

### **Real Performance Testing**
Actual timing measurements in real browsers:
- Animation duration validation
- Input responsiveness testing
- Frame rate monitoring during animations
- Scroll physics verification
- System conflict detection

### **Cross-Browser Validation**
Automated testing across:
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome Mobile, Safari Mobile
- **Viewports**: Phone, tablet, desktop sizes
- **Accessibility**: Keyboard navigation, screen readers

## Writing Tests

### **Use the Template**

Copy `tests/template-example.test.ts` and modify:

```typescript
import { test, expect, TestHelpers } from './base-test';

test.describe('My Component', () => {
  test.beforeEach(async ({ setupPage, logger, screenshots }) => {
    // Navigation and baseline screenshot are automatic
    await TestHelpers.navigateWithLogging(setupPage, '/', logger, screenshots);
    await TestHelpers.waitForElement(setupPage, 'body', logger);
  });

  test('should perform action quickly', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test performance', 'Measuring action speed');
    
    // Measure actual performance
    const timing = await TestHelpers.measurePerformance(
      page,
      'Button click response',
      async () => {
        await TestHelpers.clickWithLogging(page, 'button', logger, screenshots);
      },
      logger
    );
    
    // Real performance requirement
    expect(timing).toBeLessThan(500);
  });
});
```

### **Test Helpers Available**

**Navigation & Interaction:**
```typescript
// Navigate with logging and screenshots
await TestHelpers.navigateWithLogging(page, '/path', logger, screenshots);

// Click with before/after screenshots
await TestHelpers.clickWithLogging(page, 'selector', logger, screenshots);

// Wait for elements with logging
await TestHelpers.waitForElement(page, 'selector', logger);

// Type with logging
await TestHelpers.typeWithLogging(page, 'input', 'text', logger);
```

**Performance & Validation:**
```typescript
// Measure action timing
const duration = await TestHelpers.measurePerformance(page, 'action', async () => {
  // perform action
}, logger);

// Check accessibility
await TestHelpers.checkAccessibility(page, logger);

// Assert with logging
await TestHelpers.assertWithLogging(condition, 'description', logger);
```

**Screenshots:**
```typescript
// Baseline full-page screenshot
await screenshots.takeBaseline(page, 'initial-state');

// Step screenshots with auto-numbering
await screenshots.takeStep(page, 'after-action');

// Mobile responsive screenshots
await screenshots.takeMobileViewports(page, 'responsive-test');

// Accessibility screenshots
await screenshots.takeAccessibilityScreenshot(page, 'a11y-check');

// Performance sequence (animation frames)
await screenshots.takePerformanceSequence(page, 'scroll-animation', 2000);
```

**Logging:**
```typescript
// Log test steps
logger.logStep('Action name', 'Description of what this does');

// Log custom events
logger.logEntry('EVENT_TYPE', 'Message', { optional: 'data' });

// Get all logged entries
const logs = logger.getLogEntries();
```

## Test Categories

### **Performance Tests**
Validate actual user experience metrics:
- Animation duration < 800ms
- Input response < 100ms  
- Consistent frame rates (>30fps)
- Smooth scroll physics
- No system conflicts

### **Functional Tests**
Test core component behavior:
- Navigation methods (keyboard, mouse, touch)
- State management accuracy
- Error handling and recovery
- Content rendering correctness

### **Accessibility Tests**
Ensure inclusive design:
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode functionality
- Focus management
- ARIA attribute presence

### **Cross-Browser Tests**
Validate consistent behavior:
- Chrome, Firefox, Safari compatibility
- Mobile vs desktop differences
- Touch vs mouse interaction
- Responsive layout behavior

## Performance Standards

### **Animation Performance**
- **Duration**: Transitions complete within 800ms
- **Responsiveness**: Input acknowledged within 100ms
- **Smoothness**: Maintain >30fps during animations
- **No conflicts**: Single animation system active

### **Loading Performance**
- **First paint**: Content visible within 2s
- **Interactive**: User input responsive within 3s
- **No errors**: Zero critical JavaScript errors
- **Network**: All resources load successfully

### **Accessibility Standards**
- **Images**: All images have alt text
- **Forms**: All inputs have labels
- **Navigation**: Keyboard accessible
- **Contrast**: Text meets WCAG standards

## Debugging Failed Tests

### **Check Logs**
```bash
# View detailed logs
cat test-results/logs/test-name-timestamp.log

# Search for specific errors
grep "ERROR" test-results/logs/*.log
```

### **Review Screenshots**
```bash
# View failure screenshots
open test-results/screenshots/test-name/failure-*.png

# Check step progression
open test-results/screenshots/test-name/step-*.png
```

### **Watch Videos**
```bash
# View full test interaction
open test-results/test-name/video.webm
```

### **Common Issues**

**Performance Failures:**
- Check animation duration settings in component code
- Verify scroll physics configuration (lerp values)
- Look for conflicting animation systems
- Review debouncing settings

**Loading Failures:**
- Verify demo server is running on port 5184
- Check network connectivity
- Review browser console for JavaScript errors
- Confirm component initialization

**Accessibility Failures:**
- Add missing alt attributes to images
- Include labels for form inputs
- Implement keyboard event handlers
- Check color contrast ratios

## Best Practices

### **DO ✅**
- Test real user interactions and performance
- Take screenshots at key moments
- Measure actual timing, not estimates
- Test across multiple browsers and devices
- Validate accessibility automatically
- Log comprehensive debugging information

### **DON'T ❌**
- Mock animation libraries or timing functions
- Skip performance measurements
- Ignore console errors or warnings
- Test only implementation details
- Assume accessibility without validation
- Write tests without clear user value

## Configuration

### **Browser Settings**
Edit `playwright.config.ts` to modify:
- Browser types and versions
- Viewport sizes and devices
- Test timeouts and retries
- Screenshot and video settings
- Parallel execution workers

### **Test Environment**
The demo server runs automatically:
- **URL**: http://localhost:5184
- **Auto-start**: Tests launch demo server
- **Port conflicts**: Server stops/starts automatically

### **Artifact Storage**
Test results are organized:
```
test-results/
├── logs/                    # Console output files
├── screenshots/             # Visual documentation
├── videos/                  # Full interaction recordings
├── traces/                  # Playwright debugging traces
└── reports/                 # HTML test reports
```

## Contributing

### **Adding New Tests**
1. Copy `tests/template-example.test.ts`
2. Rename and modify for your use case
3. Follow existing patterns for logging and screenshots
4. Include performance measurements where relevant
5. Add accessibility checks for UI tests

### **Extending Framework**
- Add new helpers to `tests/base-test.ts`
- Extend screenshot types in `tests/utils/screenshot-manager.ts`
- Add logging categories in `tests/utils/test-logger.ts`
- Update configuration in `playwright.config.ts`

---

**This framework validates what users actually experience. When tests pass, users have a good experience. When tests fail, there are real problems to fix.**