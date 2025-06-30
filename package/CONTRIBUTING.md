# Contributing to StoryScroller

Thank you for your interest in contributing to StoryScroller! We welcome contributions of all kinds, from bug reports and feature requests to code improvements and documentation.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome and support people of all backgrounds
- **Be Collaborative**: Work together constructively
- **Be Patient**: Help others learn and grow
- **Be Professional**: Keep discussions focused and productive

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: latest LTS)
- **pnpm** 8+ (preferred) or npm 9+
- **Git** for version control

### Repository Structure

```
storyscroller/
├── package/          # Main StoryScroller package
│   ├── src/         # Source code
│   ├── tests/       # Test files
│   └── docs/        # Documentation
└── demo/            # Demo application
```

## 🤝 How to Contribute

### 🐛 Reporting Bugs

Before submitting a bug report:

1. **Check existing issues** to avoid duplicates
2. **Use the latest version** of StoryScroller
3. **Test in multiple browsers** when possible

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should have happened

## Actual Behavior
What actually happened

## Environment
- StoryScroller version: 
- React version:
- Browser: 
- OS: 

## Additional Context
Screenshots, logs, or other relevant information
```

### 💡 Suggesting Features

Feature requests are welcome! Please:

1. **Check if it already exists** in issues or roadmap
2. **Explain the use case** and why it's needed
3. **Consider backwards compatibility**
4. **Propose an API design** if applicable

### 📝 Improving Documentation

Documentation improvements are always appreciated:

- Fix typos or unclear explanations
- Add examples or use cases
- Improve API documentation
- Update troubleshooting guides

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/storyscroller.git
cd storyscroller/package
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development

```bash
# Build in watch mode
pnpm dev

# Run tests
pnpm test

# Run unit tests
pnpm test:unit

# Start demo app (in separate terminal)
cd ../demo
pnpm dev
```

### 4. Verify Setup

```bash
# Check that everything builds
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

## 📏 Coding Standards

### TypeScript

- **Strict mode enabled**: Follow strict TypeScript rules
- **Explicit types**: Prefer explicit types over `any`
- **Interfaces over types**: Use interfaces for object shapes
- **Export types**: Always export types that might be used externally

```typescript
// ✅ Good
interface ScrollState {
  currentSection: number;
  isAnimating: boolean;
}

// ❌ Avoid
const state: any = { ... }
```

### React

- **Functional components**: Use function components with hooks
- **TypeScript props**: Always type component props
- **Ref handling**: Use `useRef` for DOM references
- **Effect cleanup**: Always clean up effects

```typescript
// ✅ Good
interface Props {
  sections: ReactNode[];
  onSectionChange?: (index: number) => void;
}

export const Component: React.FC<Props> = ({ sections, onSectionChange }) => {
  // Implementation
}
```

### Code Style

- **ESLint configuration**: Follow the project's ESLint rules
- **Prettier formatting**: Code is auto-formatted with Prettier
- **Meaningful names**: Use descriptive variable and function names
- **Small functions**: Keep functions focused and small
- **Comments**: Add comments for complex logic only

### Performance

- **Avoid unnecessary re-renders**: Use `useCallback` and `useMemo` appropriately
- **Debounce heavy operations**: Use debouncing for scroll events
- **Clean up resources**: Remove event listeners and cancel animations

### Error Handling

- **Graceful degradation**: Provide fallbacks for JS failures
- **Error boundaries**: Wrap components in error boundaries
- **Helpful error messages**: Make errors actionable for developers

## 🧪 Testing

### Test Categories

1. **Unit Tests** (`tests/unit/`): Test individual functions and utilities
2. **Functional Tests** (`tests/functional/`): Test user interactions and navigation
3. **Performance Tests**: Test animation timing and responsiveness

### Writing Tests

```typescript
// Unit test example
test('should calculate correct section from scroll position', () => {
  const viewportHeight = 720;
  const scrollY = 1440;
  const section = Math.round(scrollY / viewportHeight);
  expect(section).toBe(2);
});

// Functional test example
test('should navigate to next section on wheel down', async ({ page }) => {
  await page.goto('/');
  await simulateWheelEvent(page, 100);
  await waitFor(() => expectSection(page, 1));
});
```

### Test Guidelines

- **Test behavior, not implementation**: Focus on what the component does
- **Use descriptive test names**: Make test purpose clear
- **Avoid testing third-party libraries**: Don't test GSAP or Lenis internals
- **Mock carefully**: Only mock when necessary for isolation

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Specific test file
pnpm test critical-navigation-issues

# Debug mode
pnpm test:debug

# Generate coverage
pnpm test:coverage
```

## 🔄 Pull Request Process

### Before Submitting

1. **Create a branch**: `git checkout -b feature/your-feature-name`
2. **Write tests**: Ensure new code is tested
3. **Update docs**: Update README or docs if needed
4. **Run quality checks**:
   ```bash
   pnpm build
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

### PR Guidelines

- **Clear title**: Summarize the change in the title
- **Detailed description**: Explain what and why, not just what
- **Link issues**: Reference related issues with "Fixes #123"
- **Small scope**: Keep PRs focused on a single change
- **No breaking changes**: Avoid breaking changes in patch releases

### PR Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Functional tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors or warnings
```

### Review Process

1. **Automated checks**: All CI checks must pass
2. **Code review**: At least one maintainer review required
3. **Testing verification**: All tests must pass
4. **Documentation review**: Ensure docs are updated if needed

## 🚢 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.1): Bug fixes, performance improvements
- **Minor** (1.1.0): New features, backwards compatible
- **Major** (2.0.0): Breaking changes

### Release Timeline

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly or when significant features are ready
- **Major releases**: Annually or when breaking changes accumulate

### Contributing to Releases

- **Changelog updates**: Update CHANGELOG.md with your changes
- **Migration guides**: Provide migration steps for breaking changes
- **Version bumps**: Maintainers handle version bumping

## 🏷️ Issue Labels

We use labels to categorize issues:

- **Type**: `bug`, `enhancement`, `documentation`, `question`
- **Priority**: `critical`, `high`, `medium`, `low`
- **Status**: `needs-triage`, `in-progress`, `blocked`, `ready-for-review`
- **Scope**: `navigation`, `animation`, `accessibility`, `performance`

## 📞 Getting Help

- **Documentation**: Check README and docs/ directory
- **Existing Issues**: Search for similar problems
- **Discussions**: Use GitHub Discussions for questions
- **Discord/Slack**: [Community link] for real-time help

## 📊 Development Metrics

We track these metrics to ensure quality:

- **Test Coverage**: Maintain > 90% coverage
- **Bundle Size**: Keep core under 50KB
- **Performance**: Animation timing within targets
- **Accessibility**: WCAG 2.1 AA compliance

## 🎯 Contribution Ideas

Looking to contribute? Here are some areas that need help:

### 🐛 Bug Fixes
- Cross-browser compatibility issues
- Edge case handling
- Performance optimizations

### ✨ Features
- Enhanced accessibility features
- New easing functions
- Performance monitoring tools

### 📚 Documentation
- More examples and use cases
- Video tutorials
- Migration guides

### 🧪 Testing
- Edge case test coverage
- Performance benchmarks
- Accessibility testing

## 🙏 Recognition

Contributors are recognized in:
- **CHANGELOG.md**: Feature and fix credits
- **GitHub contributors**: Automatic recognition
- **Release notes**: Major contribution highlights

Thank you for contributing to StoryScroller! 🎉