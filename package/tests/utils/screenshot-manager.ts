import { Page } from '@playwright/test';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface ScreenshotOptions {
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  mask?: string[];
  quality?: number;
  threshold?: number;
  animations?: 'disabled' | 'allow';
}

export class ScreenshotManager {
  private screenshotDir: string;
  private testName: string;
  private stepCounter: number = 0;

  constructor(testName: string) {
    this.testName = testName.replace(/[^a-zA-Z0-9-_]/g, '-');
    this.screenshotDir = join('test-results', 'screenshots', this.testName);
    
    // Ensure screenshot directory exists
    if (!existsSync(this.screenshotDir)) {
      mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Take a baseline screenshot (full page)
   */
  async takeBaseline(page: Page, name: string = 'baseline'): Promise<string> {
    const filename = `${name}.png`;
    const path = join(this.screenshotDir, filename);
    
    await page.screenshot({
      path,
      fullPage: true,
      animations: 'disabled'
    });
    
    return path;
  }

  /**
   * Take a step screenshot with automatic numbering
   */
  async takeStep(page: Page, stepName: string, options: ScreenshotOptions = {}): Promise<string> {
    this.stepCounter++;
    const filename = `step-${this.stepCounter.toString().padStart(2, '0')}-${stepName.replace(/[^a-zA-Z0-9-_]/g, '-')}.png`;
    const path = join(this.screenshotDir, filename);
    
    const screenshotOptions = {
      path,
      fullPage: options.fullPage ?? false,
      animations: options.animations ?? 'disabled',
      ...options
    };
    
    await page.screenshot(screenshotOptions);
    return path;
  }

  /**
   * Take a comparison screenshot for visual regression testing
   */
  async takeComparison(page: Page, name: string, options: ScreenshotOptions = {}): Promise<string> {
    const filename = `${name}-comparison.png`;
    const path = join(this.screenshotDir, filename);
    
    const screenshotOptions = {
      path,
      fullPage: options.fullPage ?? true,
      animations: options.animations ?? 'disabled',
      threshold: options.threshold ?? 0.3,
      ...options
    };
    
    await page.screenshot(screenshotOptions);
    return path;
  }

  /**
   * Take a failure screenshot
   */
  async takeFailure(page: Page, errorMessage?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `failure-${timestamp}.png`;
    const path = join(this.screenshotDir, filename);
    
    try {
      await page.screenshot({
        path,
        fullPage: true,
        animations: 'allow' // Show current state even if animating
      });
    } catch (error) {
      console.error(`Failed to take failure screenshot: ${error}`);
    }
    
    return path;
  }

  /**
   * Take mobile-specific screenshots at different viewports
   */
  async takeMobileViewports(page: Page, stepName: string): Promise<string[]> {
    const viewports = [
      { name: 'mobile-portrait', width: 375, height: 667 },
      { name: 'mobile-landscape', width: 667, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 }
    ];
    
    const screenshots: string[] = [];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for any responsive changes
      await page.waitForTimeout(500);
      
      const filename = `${stepName}-${viewport.name}.png`;
      const path = join(this.screenshotDir, filename);
      
      await page.screenshot({
        path,
        fullPage: false, // Viewport only for mobile
        animations: 'disabled'
      });
      
      screenshots.push(path);
    }
    
    return screenshots;
  }

  /**
   * Take accessibility screenshots (with high contrast)
   */
  async takeAccessibilityScreenshot(page: Page, stepName: string): Promise<string> {
    // Enable high contrast mode
    await page.emulateMedia({ 
      colorScheme: 'dark',
      reducedMotion: 'reduce'
    });
    
    const filename = `${stepName}-accessibility.png`;
    const path = join(this.screenshotDir, filename);
    
    await page.screenshot({
      path,
      fullPage: true,
      animations: 'disabled'
    });
    
    // Reset media emulation
    await page.emulateMedia({ 
      colorScheme: 'light',
      reducedMotion: 'no-preference'
    });
    
    return path;
  }

  /**
   * Take performance screenshots during animations
   */
  async takePerformanceSequence(page: Page, actionName: string, duration: number = 2000): Promise<string[]> {
    const screenshots: string[] = [];
    const frameCount = Math.floor(duration / 100); // Screenshot every 100ms
    
    for (let i = 0; i < frameCount; i++) {
      const filename = `${actionName}-frame-${i.toString().padStart(3, '0')}.png`;
      const path = join(this.screenshotDir, filename);
      
      await page.screenshot({
        path,
        fullPage: false,
        animations: 'allow' // Show animation state
      });
      
      screenshots.push(path);
      await page.waitForTimeout(100);
    }
    
    return screenshots;
  }

  /**
   * Get screenshot directory path
   */
  getScreenshotDir(): string {
    return this.screenshotDir;
  }

  /**
   * Get all screenshot paths taken
   */
  getScreenshotPaths(): string[] {
    const fs = require('fs');
    if (!existsSync(this.screenshotDir)) return [];
    
    return fs.readdirSync(this.screenshotDir)
      .filter((file: string) => file.endsWith('.png'))
      .map((file: string) => join(this.screenshotDir, file));
  }
}