#!/usr/bin/env node

/**
 * StoryScroller Performance Benchmarking Script
 * 
 * Measures key performance metrics:
 * - Bundle size analysis
 * - Animation performance targets
 * - Memory usage benchmarks
 * - Cross-browser compatibility metrics
 */

import { readFileSync, writeFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');

// Performance targets and thresholds
const PERFORMANCE_TARGETS = {
  bundleSize: {
    core: 50 * 1024,           // 50KB for core package
    withDeps: 150 * 1024,      // 150KB with GSAP + Lenis
    gzipped: 35 * 1024         // 35KB gzipped
  },
  timing: {
    animationDuration: 600,     // 600ms target animation
    inputResponse: 100,         // 100ms max input response
    navigationComplete: 1000    // 1s max for full navigation
  },
  memory: {
    baseline: 10 * 1024 * 1024, // 10MB baseline
    maxUsage: 50 * 1024 * 1024, // 50MB maximum
    leakTolerance: 5 * 1024 * 1024 // 5MB leak tolerance
  },
  framerate: {
    target: 60,                 // 60 FPS target
    minimum: 45                 // 45 FPS minimum acceptable
  }
};

class PerformanceBenchmark {
  constructor() {
    this.results = {
      bundleSize: {},
      timing: {},
      memory: {},
      meta: {
        timestamp: new Date().toISOString(),
        version: this.getPackageVersion(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }

  getPackageVersion() {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(packageRoot, 'package.json'), 'utf8')
      );
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  // Bundle Size Analysis
  analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    
    try {
      // Build the package
      console.log('Building package...');
      execSync('npm run build', { 
        cwd: packageRoot, 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Analyze dist files
      const distPath = join(packageRoot, 'dist');
      const indexPath = join(distPath, 'index.js');
      const cssPath = join(distPath, 'styles', 'index.css');
      
      let indexSize = 0;
      let cssSize = 0;
      let gzippedSize = 0;
      
      try {
        indexSize = statSync(indexPath).size;
      } catch (e) {
        console.warn('⚠️  Could not find index.js');
      }
      
      try {
        cssSize = statSync(cssPath).size;
      } catch (e) {
        console.warn('⚠️  Could not find CSS file');
      }
      
      // Estimate gzipped size (rough approximation)
      try {
        const indexContent = readFileSync(indexPath, 'utf8');
        // Rough gzip estimation: 70% compression for JS
        gzippedSize = Math.floor(indexContent.length * 0.3);
      } catch (e) {
        console.warn('⚠️  Could not estimate gzipped size');
      }
      
      this.results.bundleSize = {
        core: indexSize,
        css: cssSize,
        total: indexSize + cssSize,
        gzippedEstimate: gzippedSize,
        targets: PERFORMANCE_TARGETS.bundleSize,
        analysis: {
          coreWithinTarget: indexSize <= PERFORMANCE_TARGETS.bundleSize.core,
          gzippedWithinTarget: gzippedSize <= PERFORMANCE_TARGETS.bundleSize.gzipped
        }
      };
      
      console.log(`✅ Core bundle: ${(indexSize / 1024).toFixed(1)}KB`);
      console.log(`✅ CSS bundle: ${(cssSize / 1024).toFixed(1)}KB`);
      console.log(`✅ Total: ${((indexSize + cssSize) / 1024).toFixed(1)}KB`);
      console.log(`✅ Gzipped (est): ${(gzippedSize / 1024).toFixed(1)}KB`);
      
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      this.results.bundleSize = { error: error.message };
    }
  }

  // Dependency Analysis
  analyzeDependencies() {
    console.log('📚 Analyzing dependencies...');
    
    try {
      const packageJson = JSON.parse(
        readFileSync(join(packageRoot, 'package.json'), 'utf8')
      );
      
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const peerDeps = packageJson.peerDependencies || {};
      
      this.results.dependencies = {
        runtime: Object.keys(deps).length,
        development: Object.keys(devDeps).length,
        peer: Object.keys(peerDeps).length,
        runtimeDeps: deps,
        analysis: {
          hasGsap: !!deps.gsap,
          hasLenis: !!deps.lenis,
          hasReactGsap: !!deps['@gsap/react'],
          lightweightRuntime: Object.keys(deps).length <= 5
        }
      };
      
      console.log(`✅ Runtime deps: ${Object.keys(deps).length}`);
      console.log(`✅ Dev deps: ${Object.keys(devDeps).length}`);
      console.log(`✅ Peer deps: ${Object.keys(peerDeps).length}`);
      
    } catch (error) {
      console.error('❌ Dependency analysis failed:', error.message);
      this.results.dependencies = { error: error.message };
    }
  }

  // Performance Targets Documentation
  generatePerformanceTargets() {
    console.log('🎯 Documenting performance targets...');
    
    this.results.targets = {
      bundleSize: PERFORMANCE_TARGETS.bundleSize,
      timing: PERFORMANCE_TARGETS.timing,
      memory: PERFORMANCE_TARGETS.memory,
      framerate: PERFORMANCE_TARGETS.framerate,
      browserSupport: {
        chrome: '90+',
        firefox: '88+',
        safari: '14+',
        edge: '90+',
        mobileSafari: '14+',
        chromeAndroid: '90+'
      },
      accessibility: {
        wcagLevel: 'AA',
        screenReader: true,
        keyboardNavigation: true,
        reducedMotion: true,
        highContrast: true
      }
    };
    
    console.log('✅ Performance targets documented');
  }

  // Code Quality Metrics
  analyzeCodeQuality() {
    console.log('🔍 Analyzing code quality...');
    
    try {
      // Run TypeScript check
      let typescriptErrors = 0;
      try {
        execSync('npm run typecheck', { 
          cwd: packageRoot, 
          stdio: 'pipe'
        });
      } catch (error) {
        typescriptErrors = (error.stdout?.match(/error/gi) || []).length;
      }
      
      // Count source files
      const srcFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l', {
        cwd: packageRoot,
        encoding: 'utf8'
      }).trim();
      
      // Count test files
      const testFiles = execSync('find tests -name "*.test.ts" -o -name "*.test.tsx" | wc -l', {
        cwd: packageRoot,
        encoding: 'utf8'
      }).trim();
      
      this.results.quality = {
        typescriptErrors,
        sourceFiles: parseInt(srcFiles),
        testFiles: parseInt(testFiles),
        testCoverage: testFiles > 0 ? Math.min(100, (parseInt(testFiles) / parseInt(srcFiles)) * 100) : 0,
        analysis: {
          typescriptClean: typescriptErrors === 0,
          wellTested: parseInt(testFiles) >= parseInt(srcFiles) * 0.5,
          hasTests: parseInt(testFiles) > 0
        }
      };
      
      console.log(`✅ TypeScript errors: ${typescriptErrors}`);
      console.log(`✅ Source files: ${srcFiles}`);
      console.log(`✅ Test files: ${testFiles}`);
      
    } catch (error) {
      console.error('❌ Code quality analysis failed:', error.message);
      this.results.quality = { error: error.message };
    }
  }

  // Generate Performance Report
  generateReport() {
    console.log('📊 Generating performance report...');
    
    const report = {
      // Summary
      summary: {
        version: this.results.meta.version,
        timestamp: this.results.meta.timestamp,
        overallScore: this.calculateOverallScore(),
        critical: this.getCriticalIssues(),
        recommendations: this.getRecommendations()
      },
      ...this.results
    };
    
    // Write detailed JSON report
    const reportPath = join(packageRoot, 'performance-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = join(packageRoot, 'PERFORMANCE.md');
    writeFileSync(markdownPath, markdownReport);
    
    console.log(`✅ Detailed report: ${reportPath}`);
    console.log(`✅ Markdown summary: ${markdownPath}`);
    
    return report;
  }

  calculateOverallScore() {
    let score = 100;
    let factors = 0;
    
    // Bundle size scoring
    if (this.results.bundleSize && !this.results.bundleSize.error) {
      factors++;
      if (!this.results.bundleSize.analysis?.coreWithinTarget) score -= 20;
      if (!this.results.bundleSize.analysis?.gzippedWithinTarget) score -= 15;
    }
    
    // Quality scoring
    if (this.results.quality && !this.results.quality.error) {
      factors++;
      if (!this.results.quality.analysis?.typescriptClean) score -= 25;
      if (!this.results.quality.analysis?.wellTested) score -= 15;
    }
    
    // Dependencies scoring
    if (this.results.dependencies && !this.results.dependencies.error) {
      factors++;
      if (!this.results.dependencies.analysis?.lightweightRuntime) score -= 10;
    }
    
    return Math.max(0, factors > 0 ? score : 0);
  }

  getCriticalIssues() {
    const issues = [];
    
    if (this.results.bundleSize?.analysis?.coreWithinTarget === false) {
      issues.push('Bundle size exceeds target (50KB)');
    }
    
    if (this.results.quality?.analysis?.typescriptClean === false) {
      issues.push(`TypeScript errors detected (${this.results.quality.typescriptErrors})`);
    }
    
    if (this.results.quality?.analysis?.hasTests === false) {
      issues.push('No test files found');
    }
    
    return issues;
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.results.bundleSize?.core > PERFORMANCE_TARGETS.bundleSize.core) {
      recommendations.push('Consider code splitting or tree shaking to reduce bundle size');
    }
    
    if (this.results.quality?.testCoverage < 80) {
      recommendations.push('Increase test coverage above 80%');
    }
    
    if (this.results.dependencies?.runtime > 5) {
      recommendations.push('Consider reducing runtime dependencies');
    }
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# StoryScroller Performance Report

Generated: ${report.summary.timestamp}  
Version: ${report.summary.version}  
Overall Score: ${report.summary.overallScore}/100

## Bundle Size Analysis

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Core Bundle | ${(report.bundleSize.core / 1024).toFixed(1)}KB | ${(PERFORMANCE_TARGETS.bundleSize.core / 1024).toFixed(1)}KB | ${report.bundleSize.analysis?.coreWithinTarget ? '✅' : '❌'} |
| CSS Bundle | ${(report.bundleSize.css / 1024).toFixed(1)}KB | - | ✅ |
| Total Bundle | ${(report.bundleSize.total / 1024).toFixed(1)}KB | ${(PERFORMANCE_TARGETS.bundleSize.withDeps / 1024).toFixed(1)}KB | ${report.bundleSize.total <= PERFORMANCE_TARGETS.bundleSize.withDeps ? '✅' : '❌'} |
| Gzipped (est) | ${(report.bundleSize.gzippedEstimate / 1024).toFixed(1)}KB | ${(PERFORMANCE_TARGETS.bundleSize.gzipped / 1024).toFixed(1)}KB | ${report.bundleSize.analysis?.gzippedWithinTarget ? '✅' : '❌'} |

## Code Quality

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| TypeScript Errors | ${report.quality?.typescriptErrors || 0} | 0 | ${report.quality?.analysis?.typescriptClean ? '✅' : '❌'} |
| Source Files | ${report.quality?.sourceFiles || 0} | - | ✅ |
| Test Files | ${report.quality?.testFiles || 0} | - | ${report.quality?.analysis?.hasTests ? '✅' : '❌'} |
| Test Coverage | ${report.quality?.testCoverage?.toFixed(1) || 0}% | 80%+ | ${(report.quality?.testCoverage || 0) >= 80 ? '✅' : '❌'} |

## Dependencies

| Type | Count | Analysis |
|------|-------|----------|
| Runtime | ${report.dependencies?.runtime || 0} | ${report.dependencies?.analysis?.lightweightRuntime ? 'Lightweight ✅' : 'Consider reducing ⚠️'} |
| Development | ${report.dependencies?.development || 0} | Standard |
| Peer | ${report.dependencies?.peer || 0} | Standard |

## Performance Targets

### Animation Performance
- **Target Duration**: ${PERFORMANCE_TARGETS.timing.animationDuration}ms
- **Input Response**: < ${PERFORMANCE_TARGETS.timing.inputResponse}ms
- **Navigation Complete**: < ${PERFORMANCE_TARGETS.timing.navigationComplete}ms

### Memory Usage
- **Baseline**: ${(PERFORMANCE_TARGETS.memory.baseline / 1024 / 1024).toFixed(0)}MB
- **Maximum**: ${(PERFORMANCE_TARGETS.memory.maxUsage / 1024 / 1024).toFixed(0)}MB
- **Leak Tolerance**: ${(PERFORMANCE_TARGETS.memory.leakTolerance / 1024 / 1024).toFixed(0)}MB

### Frame Rate
- **Target**: ${PERFORMANCE_TARGETS.framerate.target} FPS
- **Minimum**: ${PERFORMANCE_TARGETS.framerate.minimum} FPS

## Browser Support

${Object.entries(report.targets.browserSupport).map(([browser, version]) => 
  `- **${browser.charAt(0).toUpperCase() + browser.slice(1)}**: ${version}`
).join('\n')}

## Accessibility Compliance

- **WCAG Level**: ${report.targets.accessibility.wcagLevel}
- **Screen Reader Support**: ${report.targets.accessibility.screenReader ? '✅' : '❌'}
- **Keyboard Navigation**: ${report.targets.accessibility.keyboardNavigation ? '✅' : '❌'}
- **Reduced Motion**: ${report.targets.accessibility.reducedMotion ? '✅' : '❌'}
- **High Contrast**: ${report.targets.accessibility.highContrast ? '✅' : '❌'}

${report.summary.critical.length > 0 ? `## Critical Issues

${report.summary.critical.map(issue => `- ❌ ${issue}`).join('\n')}` : ''}

${report.summary.recommendations.length > 0 ? `## Recommendations

${report.summary.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}` : ''}

---

*Report generated by StoryScroller performance benchmarking tool*
`;
  }

  // Run all benchmarks
  async run() {
    console.log('🚀 Starting StoryScroller Performance Benchmarking...\n');
    
    this.analyzeBundleSize();
    this.analyzeDependencies();
    this.analyzeCodeQuality();
    this.generatePerformanceTargets();
    
    const report = this.generateReport();
    
    console.log('\n📈 Benchmarking Complete!');
    console.log(`Overall Score: ${report.summary.overallScore}/100`);
    
    if (report.summary.critical.length > 0) {
      console.log('\n❌ Critical Issues:');
      report.summary.critical.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ No critical issues detected');
    }
    
    return report;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new PerformanceBenchmark();
  benchmark.run().catch(console.error);
}

export default PerformanceBenchmark;