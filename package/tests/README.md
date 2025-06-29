# StoryScroller Testing Framework

## Overview

Professional Playwright-based testing framework that validates real user experience through performance measurement, visual documentation, and cross-browser compatibility testing.

## Quick Reference

```bash
# Run all tests
pnpm test

# Run with browser visible  
pnpm test:headed

# Debug specific test
pnpm test:debug

# View test results
pnpm test:report
```

## Framework Architecture

### Core Components
- **base-test.ts**: Extended Playwright with fixtures for logging and screenshots
- **utils/test-logger.ts**: Complete console output capture with timestamps
- **utils/screenshot-manager.ts**: Strategic visual documentation system
- **functional/**: Performance and behavior validation tests
- **template-example.test.ts**: Copy-paste template for new tests

### Test Capabilities
- **Performance Measurement**: Real timing validation in browsers
- **Visual Documentation**: Screenshots at key test moments
- **Console Monitoring**: Complete browser output capture
- **Cross-Browser Testing**: Chrome, Firefox, Safari, Mobile variants
- **Accessibility Validation**: Automated compliance checking
- **Error Recovery**: Comprehensive failure debugging

## Performance Standards

Tests enforce specific performance targets:
- **Animation Duration**: < 800ms for smooth user experience
- **Input Response**: < 100ms for responsive interaction
- **Frame Rate**: > 30fps during animations
- **Loading Time**: Interactive within 3 seconds
- **Error Rate**: Zero critical JavaScript errors

## Test Development

### Creating New Tests
1. Copy `template-example.test.ts`
2. Modify for your specific component/feature
3. Include performance measurements
4. Add accessibility checks
5. Use provided helper functions

### Helper Functions
```typescript
// Navigation with logging
await TestHelpers.navigateWithLogging(page, '/path', logger, screenshots);

// Performance measurement
const timing = await TestHelpers.measurePerformance(page, 'action', actionFn, logger);

// Accessibility validation
await TestHelpers.checkAccessibility(page, logger);

// Interactive elements with screenshots
await TestHelpers.clickWithLogging(page, 'button', logger, screenshots);
```

## Test Artifacts

### Generated Files
- **Logs**: `test-results/logs/` - Timestamped console output
- **Screenshots**: `test-results/screenshots/` - Visual test progression  
- **Videos**: `test-results/` - Full interaction recordings
- **Reports**: HTML test result summaries

### Debugging Features
- Complete browser console capture
- Step-by-step visual documentation
- Performance timing measurements
- Network request monitoring
- Error context with stack traces

## Configuration

### Browser Coverage
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome Mobile, Safari Mobile  
- **Viewports**: Phone, tablet, desktop sizes
- **Accessibility**: Keyboard navigation, high contrast

### Test Environment
- **Demo Server**: Auto-launched on localhost:5184
- **Parallel Execution**: Configurable worker count
- **Timeout Management**: Appropriate timeouts for real browser testing
- **Artifact Retention**: Screenshots and videos for failed tests

See `../TESTS.md` for complete documentation including examples, best practices, and troubleshooting guides.