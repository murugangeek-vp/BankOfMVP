import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Initializes test environment and starts services
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Global Setup for BankOfMVP E2E Tests');
  
  // Wait for application to be ready
  const baseURL = config.projects?.[0]?.use?.baseURL || 'http://localhost:3000';
  console.log(`📡 Waiting for application at ${baseURL}`);
  
  // Health check with retries
  const maxRetries = 30;
  const retryDelay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${baseURL.replace('3000', '5000')}/api/health`);
      if (response.ok) {
        console.log('✅ Application is ready for testing');
        break;
      }
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Application not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.log('🎯 Global Setup Complete');
}

export default globalSetup;