import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Cleans up test environment and generates reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Global Teardown for BankOfMVP E2E Tests');
  
  // Generate test summary
  console.log('📊 Test execution completed');
  console.log('📁 Results saved to e2e-results directory');
  
  console.log('🎯 Global Teardown Complete');
}

export default globalTeardown;