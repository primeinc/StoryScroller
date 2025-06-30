# Testing Guide

StoryScroller uses a comprehensive testing strategy focused on real behavior rather than mocks. Our test suite ensures reliable scroll navigation and animation performance across different environments.

## Testing Philosophy

**Real Behavior Over Mocks**: We test actual functionality instead of implementation details. Tests interact with the real scroll system, animations, and user events to catch real-world issues.

**Issue-Driven Testing**: Our tests are designed to catch specific problems found in production, ensuring regression prevention.

**Performance-Aware**: Tests include timing validations to ensure animations and navigation meet performance targets.

## Test Structure

```
tests/
├── unit/                    # Vitest unit tests
│   ├── animation-queue.test.ts
│   ├── scroll-state.test.ts
│   ├── debouncing-throttling.test.ts
│   ├── error-handling-recovery.test.ts
│   ├── scroll-physics.test.ts
│   ├── scroll-position.test.ts
│   ├── validation-type-guards.test.ts
│   └── configuration-validation.test.ts
└── functional/              # Playwright end-to-end tests
    ├── critical-navigation-issues.test.ts
    └── scroll-performance.test.ts
```

## Testing Frameworks

- **Vitest**: Unit tests for individual components and utilities
- **Playwright**: End-to-end functional testing with real browsers
- **JSDOM**: Browser environment simulation for unit tests

## Running Tests

### All Tests
```bash
npm run test:all                # Run both unit and functional tests
```

### Unit Tests
```bash
npm run test:unit               # Watch mode
npm run test:unit:run           # Single run
npm run test:unit:ui            # Visual UI mode
```

### Functional Tests
```bash
npm run test                    # Run functional tests
npm run test:ui                 # Interactive UI mode
npm run test:headed             # Run with browser visible
npm run test:debug              # Debug mode with browser DevTools
```

### Test Reports
```bash
npm run test:report             # View last test report
npm run test:report:generate    # Generate new HTML report
```

## Unit Test Categories

### 1. Animation Queue Logic (`animation-queue.test.ts`)
Tests the core animation queueing system that manages navigation requests.

**Key Behaviors Tested:**
- Request enqueuing and dequeuing (FIFO)
- Deduplication within time thresholds
- Queue processing state management
- Performance with large request volumes

**Example Test:**
```typescript
it('should reject duplicate requests within threshold', async () => {
  const request = {
    targetSection: 2,
    source: 'user_keyboard' as const,
    priority: 'normal' as const,
  };

  const first = queue.enqueue(request);
  expect(first).toBeTruthy();

  const duplicate = queue.enqueue(request);
  expect(duplicate).toBeNull(); // Rejected due to deduplication
});
```

### 2. Scroll State Management (`scroll-state.test.ts`)
Validates scroll state consistency and transitions.

**Focus Areas:**
- State initialization and reset
- Section tracking accuracy
- Animation state coordination
- Navigation readiness logic

### 3. Debouncing & Throttling (`debouncing-throttling.test.ts`)
Tests input event management to prevent excessive navigation.

**Behaviors:**
- Wheel event debouncing
- Keyboard input throttling
- Cooldown period enforcement
- Performance under rapid input

### 4. Error Handling & Recovery (`error-handling-recovery.test.ts`)
Validates system resilience and error recovery mechanisms.

**Scenarios:**
- Invalid configuration handling
- Animation system failures
- State corruption recovery
- Emergency reset functionality

### 5. Scroll Physics (`scroll-physics.test.ts`)
Tests the mathematical foundations of scroll calculations.

**Validations:**
- Section boundary calculations
- Velocity and momentum physics
- Magnetic snapping algorithms
- Easing function integration

### 6. Scroll Position (`scroll-position.test.ts`)
Validates position tracking and synchronization.

**Behaviors:**
- Position-to-section mapping
- Cross-browser consistency
- Viewport size adaptation
- Scroll position persistence

### 7. Validation & Type Guards (`validation-type-guards.test.ts`)
Tests input validation and TypeScript type safety.

**Coverage:**
- Configuration validation
- Runtime type checking
- Error message clarity
- Edge case handling

### 8. Configuration Validation (`configuration-validation.test.ts`)
Validates component props and configuration options.

**Areas:**
- Default value application
- Invalid configuration rejection
- Dynamic configuration updates
- Accessibility option validation

## Functional Test Categories

### 1. Critical Navigation Issues (`critical-navigation-issues.test.ts`)
End-to-end tests targeting specific real-world navigation problems.

**Issue Categories:**

#### Mouse Wheel Navigation
```typescript
test('should trigger navigation on wheel events', async ({ page }) => {
  await simulateWheelEvent(page, 100); // Scroll down
  await page.waitForTimeout(1500);
  
  const state = await getScrollerState(page);
  expect(state.currentSection).toBe(1); // Should navigate to section 1
});
```

#### Button Navigation Timing
- Tests rapid button clicking scenarios
- Validates reasonable navigation delays
- Ensures animations complete properly

#### State Synchronization
- Scroll position vs section index consistency
- Force sync functionality
- State drift detection and correction

#### Multi-Navigation Sequences
- Complex navigation patterns
- Queue integrity during rapid requests
- State consistency across operations

### 2. Scroll Performance (`scroll-performance.test.ts`)
Performance benchmarks and optimization validation.

**Metrics:**
- Animation frame consistency
- Memory usage during scrolling
- CPU utilization under load
- Bundle size impact measurement

## Writing New Tests

### Unit Test Pattern
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UnitTestHelpers } from './base-unit-test';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup test environment
  });

  describe('Specific Behavior', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = systemUnderTest(input);
      
      // Assert
      expect(result).toBeTruthy();
      expect(result).toHaveProperty('expectedField');
    });
  });
});
```

### Functional Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Area', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => 
      (window as any).storyScrollerAPI !== undefined
    );
  });

  test('should behave correctly when user does X', async ({ page }) => {
    // Simulate user interaction
    await page.locator('button').click();
    
    // Wait for system response
    await page.waitForTimeout(500);
    
    // Validate behavior
    const state = await getScrollerState(page);
    expect(state.currentSection).toBe(expectedSection);
  });
});
```

## Test Utilities

### Unit Test Helpers (`base-unit-test.ts`)
```typescript
export const UnitTestHelpers = {
  async measureExecutionTime(fn: () => void): Promise<{ duration: number }> {
    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    return { duration };
  },
  
  createMockScrollState(overrides = {}) {
    return {
      currentSection: 0,
      isAnimating: false,
      canNavigate: true,
      ...overrides
    };
  }
};
```

### Functional Test Helpers
```typescript
// Get current scroll state from browser
const getScrollerState = async (page: Page) => {
  return await page.evaluate(() => {
    const api = (window as any).storyScrollerAPI;
    return {
      state: api.getState(),
      queueStatus: api.getQueueStatus(),
      scrollY: window.scrollY,
      calculatedSection: Math.round(window.scrollY / window.innerHeight)
    };
  });
};

// Simulate wheel events
const simulateWheelEvent = async (page: Page, deltaY: number) => {
  await page.evaluate(({ deltaY }) => {
    const container = document.querySelector('.story-scroller-container');
    container.dispatchEvent(new WheelEvent('wheel', {
      deltaY, bubbles: true, cancelable: true
    }));
  }, { deltaY });
};
```

## Test Data Management

### Mock Data Creation
Tests use factory functions to create consistent test data:

```typescript
const createNavigationRequest = (overrides = {}) => ({
  targetSection: 1,
  source: 'user_keyboard' as const,
  priority: 'normal' as const,
  timestamp: Date.now(),
  id: `nav_${Math.random()}`,
  ...overrides
});
```

### Test Environment Setup
Each test category has its own setup requirements:

- **Unit Tests**: Isolated component instances
- **Functional Tests**: Full browser environment with demo app
- **Performance Tests**: Controlled timing and resource monitoring

## Debugging Tests

### Unit Test Debugging
```bash
npm run test:unit:ui           # Visual debugging interface
npx vitest --reporter=verbose  # Detailed output
```

### Functional Test Debugging
```bash
npm run test:debug             # Debug with DevTools
npm run test:headed            # See browser interactions
PLAYWRIGHT_HTML_REPORT=true npm run test  # Generate detailed reports
```

### Common Debugging Patterns

1. **State Inspection**: Log scroll state at key points
2. **Timing Analysis**: Add strategic waits and timeouts
3. **Event Tracing**: Monitor console output for system events
4. **Visual Validation**: Use `test:headed` mode to see what's happening

## CI/CD Integration

Tests run automatically in our GitHub Actions pipeline:

- **Pull Request**: All unit and functional tests
- **Main Branch**: Full test suite + performance benchmarks
- **Release**: Complete validation including cross-browser testing

### Test Timeouts
- Unit tests: 10 seconds per test
- Functional tests: 30 seconds per test
- Full suite: 10 minutes maximum

## Performance Benchmarks

### Target Metrics
- Animation frame rate: 60 FPS minimum
- Navigation completion: < 600ms average
- Memory usage: < 50MB during normal operation
- Bundle size: < 50KB minified + gzipped

### Monitoring
Performance regressions are caught through:
- Automated benchmark comparisons
- Bundle size tracking
- Memory leak detection
- Animation performance profiling

## Coverage Requirements

- **Unit Tests**: 85% code coverage minimum
- **Functional Tests**: 100% critical path coverage
- **Performance Tests**: All major user flows

Coverage reports are generated automatically and included in CI feedback.

## Best Practices

### Do's
- ✅ Test real user interactions, not implementation details
- ✅ Use meaningful test descriptions that explain the scenario
- ✅ Include both happy path and edge case scenarios
- ✅ Test performance characteristics when relevant
- ✅ Clean up resources in test teardown

### Don'ts
- ❌ Overuse mocks - prefer real behavior testing
- ❌ Test internal implementation details
- ❌ Write tests that depend on specific timing unless necessary
- ❌ Ignore console warnings/errors in tests
- ❌ Create tests that are flaky or environment-dependent

## Troubleshooting

### Common Issues

**Tests Timeout**: Increase wait conditions or check for animation completion
```typescript
await waitFor(async () => {
  const state = await getScrollerState(page);
  return !state.isAnimating;
}, 3000);
```

**State Synchronization**: Use force sync or wait for natural settling
```typescript
await page.evaluate(() => {
  (window as any).storyScrollerAPI.forceSync();
});
```

**Flaky Tests**: Add proper wait conditions and avoid hardcoded timeouts
```typescript
// Bad
await page.waitForTimeout(1000);

// Good
await page.waitForFunction(() => 
  window.scrollY === expectedPosition
);
```

### Getting Help

- Check test output logs for specific failure details
- Use browser DevTools in `test:debug` mode
- Review similar tests for patterns
- Consult the [Contributing Guide](CONTRIBUTING.md) for team standards

---

For questions about testing or to report test-related issues, please see our [Contributing Guidelines](CONTRIBUTING.md) or open an issue on GitHub.