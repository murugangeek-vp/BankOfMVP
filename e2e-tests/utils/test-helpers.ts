import { Page, Locator } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Test Helper Utilities for BankOfMVP E2E Tests
 * Provides common utilities for screenshot capture, error handling, and test management
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Create results directory if it doesn't exist
   */
  static ensureResultsDirectory() {
    const dirs = [
      'e2e-results',
      'e2e-results/screenshots',
      'e2e-results/videos',
      'e2e-results/traces',
      'e2e-results/performance',
      'e2e-results/visual-diff'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Capture intelligent screenshot with context
   */
  async captureScreenshot(testName: string, action: string, context?: string) {
    TestHelpers.ensureResultsDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testName}-${action}-${timestamp}.png`;
    const screenshotPath = path.join('e2e-results/screenshots', filename);
    
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    if (context) {
      await this.appendTestLog(testName, `Screenshot captured: ${action} - ${context}`);
    }
    
    return screenshotPath;
  }

  /**
   * Capture console errors and logs
   */
  async captureConsoleLogs(): Promise<string[]> {
    const logs: string[] = [];
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      
      if (msg.type() === 'error') {
        errors.push(text);
        console.log(`🚨 Browser Console Error: ${text}`);
      } else if (msg.type() === 'warning') {
        console.log(`⚠️ Browser Console Warning: ${text}`);
      }
    });
    
    return errors;
  }

  /**
   * Capture network failures and performance data
   */
  async captureNetworkData() {
    const networkData: {
      errors: Array<{ url: string; status: number; timestamp: string }>;
      performance: Array<{ url: string; duration: number; timestamp: string }>;
    } = {
      errors: [],
      performance: []
    };

    this.page.on('response', response => {
      const status = response.status();
      const url = response.url();
      const timestamp = new Date().toISOString();
      
      if (status >= 400) {
        networkData.errors.push({ url, status, timestamp });
        console.log(`🌐 Network Error: ${url} - ${status}`);
      }
    });

    this.page.on('requestfinished', request => {
      const response = request.response();
      if (response) {
        const timing = request.timing();
        const duration = timing.responseEnd;
        
        networkData.performance.push({
          url: request.url(),
          duration,
          timestamp: new Date().toISOString()
        });
      }
    });

    return networkData;
  }

  /**
   * Wait for application to be stable
   */
  async waitForApplicationStable(timeout = 30000) {
    console.log('⏳ Waiting for application to be stable...');
    
    try {
      // Wait for network idle
      await this.page.waitForLoadState('networkidle', { timeout });
      
      // Wait for no active animations
      await this.page.waitForFunction(() => {
        const animations = document.getAnimations();
        return animations.length === 0 || animations.every(anim => anim.playState === 'finished');
      }, { timeout });
      
      console.log('✅ Application is stable');
    } catch (error) {
      console.log('⚠️ Application stability check timed out, continuing...');
    }
  }

  /**
   * Measure page load performance
   */
  async measurePagePerformance(url: string) {
    const startTime = Date.now();
    
    await this.page.goto(url);
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    console.log(`📊 Page Load Performance for ${url}:`);
    console.log(`   Total Load Time: ${loadTime}ms`);
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    console.log(`   First Paint: ${metrics.firstPaint.toFixed(2)}ms`);
    console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
    
    return { loadTime, metrics };
  }

  /**
   * Smart wait for element with multiple strategies
   */
  async smartWaitForElement(selectors: string[], options = { timeout: 5000 }): Promise<Locator> {
    const errors: Error[] = [];
    
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout: options.timeout });
        console.log(`✅ Found element using selector: ${selector}`);
        return element;
      } catch (error) {
        errors.push(error as Error);
        console.log(`❌ Failed to find element with selector: ${selector}`);
      }
    }
    
    throw new Error(`Element not found with any selector: ${selectors.join(', ')}`);
  }

  /**
   * Append to test log file
   */
  private async appendTestLog(testName: string, message: string) {
    const logPath = path.join('e2e-results', 'test-log.txt');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${testName}] ${message}\n`;
    
    fs.appendFileSync(logPath, logEntry);
  }

  /**
   * Generate test summary
   */
  static generateTestSummary(testResults: any) {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.stats?.expected || 0,
      passed: testResults.stats?.expected || 0,
      failed: testResults.stats?.unexpected || 0,
      skipped: testResults.stats?.skipped || 0,
      duration: testResults.stats?.duration || 0,
      passRate: 0
    };
    
    if (summary.totalTests > 0) {
      summary.passRate = ((summary.passed / summary.totalTests) * 100).toFixed(1);
    }
    
    return summary;
  }

  /**
   * Handle test failure with comprehensive debugging
   */
  async handleTestFailure(testName: string, error: Error) {
    console.log(`❌ Test failed: ${testName}`);
    console.log(`Error: ${error.message}`);
    
    // Capture failure state
    await this.captureScreenshot(testName, 'failure', error.message);
    
    // Capture console logs
    const consoleErrors = await this.captureConsoleLogs();
    if (consoleErrors.length > 0) {
      console.log('Console errors at failure:', consoleErrors);
    }
    
    // Capture page content for debugging
    const pageContent = await this.page.content();
    const contentPath = path.join('e2e-results', `${testName}-failure-content.html`);
    fs.writeFileSync(contentPath, pageContent);
    
    console.log(`📄 Page content saved to: ${contentPath}`);
  }

  /**
   * Retry mechanism for flaky tests
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️ Attempt ${i + 1}/${maxRetries} failed, retrying...`);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}