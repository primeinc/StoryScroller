# Security Policy

## Supported Versions

We actively support the following versions of StoryScroller with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in StoryScroller, please help us address it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by:

1. **Email**: Send details to [security@primeinc.com](mailto:security@primeinc.com)
2. **GitHub Security**: Use GitHub's [private vulnerability reporting](https://github.com/primeinc/StoryScroller/security/advisories/new)

### What to Include

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Impact**: What could an attacker accomplish?
- **Reproduction**: Step-by-step instructions to reproduce the issue
- **Proof of Concept**: If possible, provide a minimal example
- **Environment**: Browser versions, React versions, etc.
- **Suggested Fix**: If you have ideas for how to fix it

### Response Timeline

We are committed to responding to security reports in a timely manner:

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Status Updates**: Every 2 weeks until resolved
- **Resolution**: Target within 90 days for critical issues

### Security Process

1. **Report Received**: We acknowledge receipt and begin investigation
2. **Vulnerability Confirmed**: We confirm the vulnerability and assess severity
3. **Fix Developed**: We develop and test a fix
4. **Security Advisory**: We prepare a security advisory if needed
5. **Release**: We release a patched version
6. **Disclosure**: We publicly disclose the vulnerability after users have had time to update

### Severity Levels

We classify vulnerabilities using the following levels:

#### Critical
- Remote code execution in user's application
- Authentication bypass
- Privilege escalation
- XSS that can compromise user data

#### High
- XSS with limited scope
- Denial of service affecting all users
- Information disclosure of sensitive data

#### Medium
- Denial of service affecting some users
- Information disclosure of non-sensitive data
- CSRF with limited impact

#### Low
- Issues with minimal security impact
- Best practice violations

### Security Best Practices

When using StoryScroller, we recommend:

#### Content Security Policy (CSP)
```
script-src 'self' 'unsafe-inline'; /* Required for GSAP animations */
style-src 'self' 'unsafe-inline';  /* Required for dynamic styles */
```

#### Input Validation
- Always validate section indices when using programmatic navigation
- Sanitize any user-provided content in sections
- Use React's built-in XSS protection (don't use dangerouslySetInnerHTML)

#### Dependency Management
- Keep StoryScroller updated to the latest version
- Regularly audit your dependencies with `npm audit`
- Consider using tools like Snyk or GitHub Dependabot

#### Production Configuration
```typescript
// Disable global API in production if not needed
<StoryScroller 
  sections={sections}
  enableGlobalAPI={false} // Recommended for production
/>
```

### Known Security Considerations

#### Global API Exposure
- The `window.storyScrollerAPI` is exposed for demo/testing purposes
- Consider disabling this in production environments
- API only exposes navigation methods, not sensitive data

#### Animation Performance
- Large numbers of rapid navigation requests are throttled
- Animation queue prevents resource exhaustion
- No user input can bypass built-in safety limits

### Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1)
- Clearly marked in release notes
- Announced through GitHub Security Advisories
- Backwards compatible when possible

### Bug Bounty

While we don't currently offer a formal bug bounty program, we deeply appreciate security research and responsible disclosure. We will:

- Acknowledge your contribution in release notes
- Work with you on public disclosure timeline
- Consider your feedback for improving our security practices

### Contact

For security-related questions or concerns:
- **Security Team**: [security@primeinc.com](mailto:security@primeinc.com)
- **General Contact**: [support@primeinc.com](mailto:support@primeinc.com)
- **GitHub Issues**: For non-security bugs only

Thank you for helping keep StoryScroller secure!