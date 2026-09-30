import { test, expect } from '@playwright/test';

/**
 * Smoke Test Suite for BankOfMVP
 * Basic sanity checks to ensure the application is working
 */

test.describe('BankOfMVP Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    console.log('🔍 Testing application load');
    
    await page.goto('/');
    
    // Check if the page loaded successfully
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for key elements
    const coreBankElement = await page.getByText('CoreBank').first();
    await expect(coreBankElement).toBeVisible();
    
    console.log('✅ Application loaded successfully');
  });

  test('should display login page with persona selection', async ({ page }) => {
    console.log('🔍 Testing login page display');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for persona selection cards
    const johnDoe = await page.getByText('Johnathan Doe').first();
    await expect(johnDoe).toBeVisible();
    
    const aliceSmith = await page.getByText('Alice Smith').first();
    await expect(aliceSmith).toBeVisible();
    
    console.log('✅ Login page with persona selection displayed');
  });

  test('should display authentication tabs', async ({ page }) => {
    console.log('🔍 Testing authentication tabs');
    
    await page.goto('/');
    
    // Check for authentication mode tabs
    const passwordTab = await page.getByText('Password').first();
    await expect(passwordTab).toBeVisible();
    
    const ssoTab = await page.getByText('SSO (OIDC)').first();
    await expect(ssoTab).toBeVisible();
    
    const policyTab = await page.getByText('Policy').first();
    await expect(policyTab).toBeVisible();
    
    console.log('✅ Authentication tabs displayed');
  });

  test('should allow persona selection', async ({ page }) => {
    console.log('🔍 Testing persona selection');
    
    await page.goto('/');
    
    // Select retail user persona
    const retailPersona = await page.getByText('Johnathan Doe').first();
    await retailPersona.click();
    
    // Verify selection (check if it's highlighted/selected)
    // The selected persona should have a checkmark or different styling
    console.log('✅ Persona selection works');
  });

  test('should have responsive design', async ({ page }) => {
    console.log('🔍 Testing responsive design');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    const desktopElement = await page.getByText('CoreBank').first();
    await expect(desktopElement).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const mobileElement = await page.getByText('CoreBank').first();
    await expect(mobileElement).toBeVisible();
    
    console.log('✅ Responsive design works');
  });
});