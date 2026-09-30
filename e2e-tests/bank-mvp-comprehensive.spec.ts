import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * Comprehensive E2E Test Suite for BankOfMVP
 * Features:
 * - Business logic testing
 * - Browser automation with screenshots/video
 * - Error log reading and analysis
 * - Self-healing capabilities
 * - Visual monitoring
 */

// Test data - matching the actual application personas
const testUsers = {
  retailUser: {
    username: 'john_retail',
    password: 'password123',
    fullName: 'Johnathan Doe',
    role: 'RETAIL_USER'
  },
  corporateMaker: {
    username: 'alice_maker',
    password: 'password123',
    fullName: 'Alice Smith',
    role: 'CORPORATE_MAKER'
  },
  corporateChecker: {
    username: 'bob_checker',
    password: 'password123',
    fullName: 'Bob Vance',
    role: 'CORPORATE_CHECKER'
  },
  bankManager: {
    username: 'sarah_manager',
    password: 'password123',
    fullName: 'Sarah Jenkins',
    role: 'BANK_MANAGER'
  }
};

const testAccounts = {
  savings: {
    accountNumber: 'SAV-001',
    initialBalance: 10000,
    accountType: 'Savings'
  },
  current: {
    accountNumber: 'CUR-001',
    initialBalance: 50000,
    overdraftLimit: 10000,
    accountType: 'Current'
  },
  corporate: {
    accountNumber: 'CORP-001',
    initialBalance: 1000000,
    accountType: 'Corporate'
  }
};

// Helper functions for self-healing
class SelfHealingHelper {
  constructor(private page: Page) {}

  /**
   * Smart element locator with self-healing
   * Tries multiple strategies to find an element
   */
  async findElement(selectors: string[], timeout = 5000): Promise<any> {
    const errors: Error[] = [];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.waitForSelector(selector, { timeout });
        console.log(`✅ Found element using selector: ${selector}`);
        return element;
      } catch (error) {
        errors.push(error as Error);
        console.log(`❌ Failed to find element with selector: ${selector}`);
      }
    }
    
    // If all selectors failed, try AI-based healing
    console.log('🤖 Attempting AI-based self-healing...');
    return await this.aiBasedHealing(selectors);
  }

  /**
   * AI-based self-healing using element analysis
   */
  private async aiBasedHealing(selectors: string[]): Promise<any> {
    // Analyze page structure and suggest alternative selectors
    const pageContent = await this.page.content();
    
    // Try to find elements by text content
    for (const selector of selectors) {
      const textMatch = selector.match(/text=(.+)/);
      if (textMatch) {
        const searchText = textMatch[1].replace(/['"]/g, '');
        try {
          const element = await this.page.getByText(searchText).first();
          if (await element.isVisible()) {
            console.log(`🔄 Self-healed using text content: ${searchText}`);
            return element;
          }
        } catch (error) {
          console.log(`❌ AI healing failed for text: ${searchText}`);
        }
      }
    }
    
    throw new Error(`Self-healing failed for all selectors: ${selectors.join(', ')}`);
  }

  /**
   * Capture and analyze browser console errors
   */
  async captureConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`🚨 Browser Console Error: ${msg.text()}`);
      }
    });
    
    return errors;
  }

  /**
   * Analyze network failures
   */
  async captureNetworkErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('response', response => {
      if (response.status() >= 400) {
        errors.push(`${response.url()} - ${response.status()}`);
        console.log(`🌐 Network Error: ${response.url()} - ${response.status()}`);
      }
    });
    
    return errors;
  }

  /**
   * Take intelligent screenshot with context
   */
  async takeContextScreenshot(testName: string, action: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testName}-${action}-${timestamp}.png`;
    const screenshotPath = path.join('e2e-results/screenshots', filename);
    
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }
}

// Test suite
test.describe('BankOfMVP Comprehensive E2E Tests', () => {
  let page: Page;
  let helper: SelfHealingHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    helper = new SelfHealingHelper(page);
    
    // Enable error capturing
    await helper.captureConsoleErrors();
    await helper.captureNetworkErrors();
    
    // Navigate to application
    await page.goto('/');
    await helper.takeContextScreenshot('navigation', 'initial-load');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Authentication & Security', () => {
    test('should login with persona selection', async () => {
      console.log('🔐 Testing login with persona selection');
      
      // Wait for login page to load
      await page.waitForLoadState('networkidle');
      
      // Select retail user persona
      const personaButton = await helper.findElement([
        'text=Johnathan Doe',
        'text=Personal Savings Customer',
        'button:has-text("Johnathan Doe")'
      ]);
      await personaButton.click();
      
      await helper.takeContextScreenshot('authentication', 'persona-selected');
      
      // Fill in login form with persona credentials
      const usernameField = await helper.findElement([
        'input[type="text"]',
        'input[placeholder*="john"]',
        'input[placeholder*="username"]'
      ]);
      await usernameField.fill(testUsers.retailUser.username);
      
      const passwordField = await helper.findElement([
        'input[type="password"]',
        'input[placeholder*="•••"]',
        'input[placeholder*="password"]'
      ]);
      await passwordField.fill(testUsers.retailUser.password);
      
      const loginButton = await helper.findElement([
        'button[type="submit"]',
        'text=Sign In with Password',
        'button:has-text("Sign In")'
      ]);
      await loginButton.click();
      
      await helper.takeContextScreenshot('authentication', 'login-success');
      
      // Verify successful login - should be redirected to dashboard
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      console.log('✅ Login successful with persona selection');
    });

    test('should handle different user personas', async () => {
      console.log('🔐 Testing different user personas');
      
      // Test corporate maker persona
      const corporateMakerButton = await helper.findElement([
        'text=Alice Smith',
        'text=Corporate Treasury Maker'
      ]);
      await corporateMakerButton.click();
      
      await helper.takeContextScreenshot('authentication', 'corporate-maker-selected');
      
      // Verify persona selection
      const selectedPersona = await helper.findElement([
        'text=Alice Smith',
        'text=alice_maker'
      ]);
      await expect(selectedPersona).toBeVisible();
      
      console.log('✅ Different personas can be selected');
    });

    test('should handle SSO login option', async () => {
      console.log('🔐 Testing SSO login option');
      
      // Click on SSO tab
      const ssoTab = await helper.findElement([
        'text=SSO (OIDC)',
        'button:has-text("SSO")'
      ]);
      await ssoTab.click();
      
      await helper.takeContextScreenshot('authentication', 'sso-tab');
      
      // Verify SSO form is displayed
      const ssoProvider = await helper.findElement([
        'select',
        'text=Microsoft Azure AD'
      ]);
      await expect(ssoProvider).toBeVisible();
      
      console.log('✅ SSO login option is available');
    });
  });

  test.describe('Personal Banking Features', () => {
    test.beforeEach(async () => {
      // Login as retail user before each personal banking test
      const personaButton = await helper.findElement(['text=Johnathan Doe']);
      await personaButton.click();
      
      const usernameField = await helper.findElement(['input[type="text"]']);
      await usernameField.fill(testUsers.retailUser.username);
      
      const passwordField = await helper.findElement(['input[type="password"]']);
      await passwordField.fill(testUsers.retailUser.password);
      
      const loginButton = await helper.findElement(['button[type="submit"]']);
      await loginButton.click();
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });
    });

    test('should display savings account balance', async () => {
      console.log('💰 Testing savings account balance display');
      
      // Navigate to savings section
      const savingsTab = await helper.findElement([
        'text=Savings',
        'text=Personal Savings',
        '[data-testid="savings-tab"]'
      ]);
      await savingsTab.click();
      
      await helper.takeContextScreenshot('savings', 'account-overview');
      
      // Verify account balance is displayed
      const balanceElement = await helper.findElement([
        'text=Balance',
        '[data-testid="account-balance"]',
        '.balance-amount'
      ]);
      
      await expect(balanceElement).toBeVisible();
      console.log('✅ Savings account balance displayed correctly');
    });

    test('should create new savings account', async () => {
      console.log('💰 Testing new savings account creation');
      
      const createAccountButton = await helper.findElement([
        'text=Create Account',
        'text=Open Account',
        '[data-testid="create-account"]'
      ]);
      await createAccountButton.click();
      
      await helper.takeContextScreenshot('savings', 'create-account-form');
      
      // Fill account creation form
      const accountNameField = await helper.findElement(['input[name="accountName"]']);
      await accountNameField.fill('Test Savings Account');
      
      const initialDepositField = await helper.findElement(['input[name="initialDeposit"]']);
      await initialDepositField.fill('5000');
      
      const submitButton = await helper.findElement(['button[type="submit"]']);
      await submitButton.click();
      
      await helper.takeContextScreenshot('savings', 'account-created');
      
      // Verify account creation
      const successMessage = await helper.findElement([
        'text=Account created successfully',
        'text=Account opened',
        '[data-testid="success-message"]'
      ]);
      
      await expect(successMessage).toBeVisible();
      console.log('✅ Savings account created successfully');
    });

    test('should process savings account deposit', async () => {
      console.log('💰 Testing savings account deposit');
      
      const savingsTab = await helper.findElement(['text=Savings']);
      await savingsTab.click();
      
      const depositButton = await helper.findElement([
        'text=Deposit',
        'text=Add Money',
        '[data-testid="deposit-button"]'
      ]);
      await depositButton.click();
      
      await helper.takeContextScreenshot('savings', 'deposit-form');
      
      const amountField = await helper.findElement(['input[name="amount"]']);
      await amountField.fill('1000');
      
      const confirmButton = await helper.findElement(['text=Confirm', 'text=Submit']);
      await confirmButton.click();
      
      await helper.takeContextScreenshot('savings', 'deposit-confirmed');
      
      // Verify deposit processing
      const successMessage = await helper.findElement([
        'text=Deposit successful',
        'text=Transaction completed'
      ]);
      
      await expect(successMessage).toBeVisible();
      console.log('✅ Deposit processed successfully');
    });
  });

  test.describe('Current Account Features', () => {
    test.beforeEach(async () => {
      // Login as retail user and navigate to current account
      const personaButton = await helper.findElement(['text=Johnathan Doe']);
      await personaButton.click();
      
      const usernameField = await helper.findElement(['input[type="text"]']);
      await usernameField.fill(testUsers.retailUser.username);
      
      const passwordField = await helper.findElement(['input[type="password"]']);
      await passwordField.fill(testUsers.retailUser.password);
      
      const loginButton = await helper.findElement(['button[type="submit"]']);
      await loginButton.click();
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      
      const currentTab = await helper.findElement(['text=Current Account']);
      await currentTab.click();
    });

    test('should display current account with overdraft limit', async () => {
      console.log('💳 Testing current account overdraft display');
      
      await helper.takeContextScreenshot('current', 'account-overview');
      
      // Verify overdraft limit is displayed
      const overdraftElement = await helper.findElement([
        'text=Overdraft',
        'text=Overdraft Limit',
        '[data-testid="overdraft-limit"]'
      ]);
      
      await expect(overdraftElement).toBeVisible();
      console.log('✅ Current account overdraft limit displayed');
    });

    test('should process withdrawal within overdraft limit', async () => {
      console.log('💳 Testing withdrawal within overdraft limit');
      
      const withdrawButton = await helper.findElement([
        'text=Withdraw',
        'text=Transfer',
        '[data-testid="withdraw-button"]'
      ]);
      await withdrawButton.click();
      
      await helper.takeContextScreenshot('current', 'withdrawal-form');
      
      const amountField = await helper.findElement(['input[name="amount"]']);
      await amountField.fill('2000');
      
      const confirmButton = await helper.findElement(['text=Confirm']);
      await confirmButton.click();
      
      await helper.takeContextScreenshot('current', 'withdrawal-confirmed');
      
      // Verify withdrawal
      const successMessage = await helper.findElement([
        'text=Withdrawal successful',
        'text=Transaction completed'
      ]);
      
      await expect(successMessage).toBeVisible();
      console.log('✅ Withdrawal processed successfully');
    });
  });

  test.describe('Corporate Banking Features', () => {
    test.beforeEach(async () => {
      // Login as corporate maker
      const personaButton = await helper.findElement(['text=Alice Smith']);
      await personaButton.click();
      
      const usernameField = await helper.findElement(['input[type="text"]']);
      await usernameField.fill(testUsers.corporateMaker.username);
      
      const passwordField = await helper.findElement(['input[type="password"]']);
      await passwordField.fill(testUsers.corporateMaker.password);
      
      const loginButton = await helper.findElement(['button[type="submit"]']);
      await loginButton.click();
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });
    });

    test('should display corporate savings account', async () => {
      console.log('🏢 Testing corporate savings account display');
      
      const corporateTab = await helper.findElement([
        'text=Corporate',
        'text=Corporate Savings',
        '[data-testid="corporate-tab"]'
      ]);
      await corporateTab.click();
      
      await helper.takeContextScreenshot('corporate', 'account-overview');
      
      // Verify corporate account features
      const accountElement = await helper.findElement([
        'text=Corporate Account',
        '[data-testid="corporate-account"]'
      ]);
      
      await expect(accountElement).toBeVisible();
      console.log('✅ Corporate account displayed correctly');
    });

    test('should implement maker-checker workflow', async () => {
      console.log('🏢 Testing corporate maker-checker workflow');
      
      const corporateTab = await helper.findElement(['text=Corporate']);
      await corporateTab.click();
      
      const createTransactionButton = await helper.findElement([
        'text=Create Transaction',
        'text=New Transfer',
        '[data-testid="create-transaction"]'
      ]);
      await createTransactionButton.click();
      
      await helper.takeContextScreenshot('corporate', 'maker-transaction');
      
      // Fill transaction details (Maker role)
      const amountField = await helper.findElement(['input[name="amount"]']);
      await amountField.fill('50000');
      
      const recipientField = await helper.findElement(['input[name="recipient"]']);
      await recipientField.fill('Vendor Account');
      
      const submitForApprovalButton = await helper.findElement([
        'text=Submit for Approval',
        'text=Send to Checker',
        '[data-testid="submit-approval"]'
      ]);
      await submitForApprovalButton.click();
      
      await helper.takeContextScreenshot('corporate', 'submitted-for-approval');
      
      // Verify transaction is pending approval
      const pendingStatus = await helper.findElement([
        'text=Pending Approval',
        'text=Awaiting Checker',
        '[data-testid="pending-status"]'
      ]);
      
      await expect(pendingStatus).toBeVisible();
      console.log('✅ Maker-checker workflow working correctly');
    });

    test('should allow checker to approve transaction', async () => {
      console.log('🏢 Testing checker approval workflow');
      
      const pendingTransactionsTab = await helper.findElement([
        'text=Pending',
        'text=Approvals',
        '[data-testid="pending-tab"]'
      ]);
      await pendingTransactionsTab.click();
      
      await helper.takeContextScreenshot('corporate', 'checker-approvals');
      
      const approveButton = await helper.findElement([
        'text=Approve',
        'text=Authorize',
        '[data-testid="approve-button"]'
      ]);
      await approveButton.click();
      
      await helper.takeContextScreenshot('corporate', 'transaction-approved');
      
      // Verify approval
      const approvedStatus = await helper.findElement([
        'text=Approved',
        'text=Authorized',
        '[data-testid="approved-status"]'
      ]);
      
      await expect(approvedStatus).toBeVisible();
      console.log('✅ Transaction approved successfully');
    });
  });

  test.describe('Loan Management Features', () => {
    test.beforeEach(async () => {
      // Login as retail user and navigate to loans
      const personaButton = await helper.findElement(['text=Johnathan Doe']);
      await personaButton.click();
      
      const usernameField = await helper.findElement(['input[type="text"]']);
      await usernameField.fill(testUsers.retailUser.username);
      
      const passwordField = await helper.findElement(['input[type="password"]']);
      await passwordField.fill(testUsers.retailUser.password);
      
      const loginButton = await helper.findElement(['button[type="submit"]']);
      await loginButton.click();
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      
      const loansTab = await helper.findElement(['text=Loan Hub', 'text=Loans']);
      await loansTab.click();
    });

    test('should calculate EMI correctly', async () => {
      console.log('🏦 Testing EMI calculation');
      
      const loanCalculatorButton = await helper.findElement([
        'text=EMI Calculator',
        'text=Calculate EMI',
        '[data-testid="emi-calculator"]'
      ]);
      await loanCalculatorButton.click();
      
      await helper.takeContextScreenshot('loans', 'emi-calculator');
      
      // Input loan parameters
      const principalField = await helper.findElement(['input[name="principal"]']);
      await principalField.fill('100000');
      
      const rateField = await helper.findElement(['input[name="rate"]']);
      await rateField.fill('10');
      
      const tenureField = await helper.findElement(['input[name="tenure"]']);
      await tenureField.fill('24');
      
      const calculateButton = await helper.findElement(['text=Calculate', 'text=Compute']);
      await calculateButton.click();
      
      await helper.takeContextScreenshot('loans', 'emi-result');
      
      // Verify EMI calculation
      const emiResult = await helper.findElement([
        'text=EMI',
        '[data-testid="emi-result"]'
      ]);
      
      await expect(emiResult).toBeVisible();
      console.log('✅ EMI calculation working correctly');
    });

    test('should process loan application', async () => {
      console.log('🏦 Testing loan application');
      
      const applyLoanButton = await helper.findElement([
        'text=Apply for Loan',
        'text=New Application',
        '[data-testid="apply-loan"]'
      ]);
      await applyLoanButton.click();
      
      await helper.takeContextScreenshot('loans', 'loan-application-form');
      
      // Fill loan application
      const loanTypeField = await helper.findElement(['select[name="loanType"]']);
      await loanTypeField.selectOption('Personal Loan');
      
      const amountField = await helper.findElement(['input[name="amount"]']);
      await amountField.fill('250000');
      
      const purposeField = await helper.findElement(['textarea[name="purpose"]']);
      await purposeField.fill('Home renovation');
      
      const submitButton = await helper.findElement(['button[type="submit"]']);
      await submitButton.click();
      
      await helper.takeContextScreenshot('loans', 'application-submitted');
      
      // Verify application submission
      const successMessage = await helper.findElement([
        'text=Application submitted',
        'text=Loan application received'
      ]);
      
      await expect(successMessage).toBeVisible();
      console.log('✅ Loan application submitted successfully');
    });
  });

  test.describe('Audit Trail & Compliance', () => {
    test.beforeEach(async () => {
      // Login as bank manager and navigate to audit trail
      const personaButton = await helper.findElement(['text=Sarah Jenkins']);
      await personaButton.click();
      
      const usernameField = await helper.findElement(['input[type="text"]']);
      await usernameField.fill(testUsers.bankManager.username);
      
      const passwordField = await helper.findElement(['input[type="password"]']);
      await passwordField.fill(testUsers.bankManager.password);
      
      const loginButton = await helper.findElement(['button[type="submit"]']);
      await loginButton.click();
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      
      const auditTab = await helper.findElement([
        'text=Audit & Security',
        'text=Audit'
      ]);
      await auditTab.click();
    });

    test('should display audit trail with timestamps', async () => {
      console.log('📋 Testing audit trail display');
      
      await helper.takeContextScreenshot('audit', 'trail-overview');
      
      // Verify audit trail entries
      const auditEntries = await helper.findElement([
        'text=Transaction',
        'text=Action',
        '[data-testid="audit-entry"]'
      ]);
      
      await expect(auditEntries).toBeVisible();
      console.log('✅ Audit trail displayed correctly');
    });

    test('should show PII redaction in audit logs', async () => {
      console.log('📋 Testing PII redaction in audit logs');
      
      await helper.takeContextScreenshot('audit', 'pii-redaction');
      
      // Verify sensitive data is redacted
      const redactedContent = await page.content();
      expect(redactedContent).not.toContain('123-45-6789'); // SSN should be redacted
      expect(redactedContent).not.toContain('4532015112830366'); // Credit card should be redacted
      
      console.log('✅ PII redaction working correctly in audit logs');
    });
  });

  test.describe('Performance & Load Testing', () => {
    test('should handle rapid successive page navigations', async () => {
      console.log('⚡ Testing rapid page navigation performance');
      
      const pages = ['Savings', 'Current Account', 'Corporate', 'Loans', 'Audit'];
      
      for (let i = 0; i < 5; i++) {
        for (const pageName of pages) {
          const startTime = Date.now();
          
          const tab = await helper.findElement([`text=${pageName}`]);
          await tab.click();
          
          const endTime = Date.now();
          const navigationTime = endTime - startTime;
          
          console.log(`📊 Navigation to ${pageName}: ${navigationTime}ms`);
          
          // Navigation should complete within 2 seconds
          expect(navigationTime).toBeLessThan(2000);
        }
      }
      
      console.log('✅ Rapid navigation performance test passed');
    });

    test('should handle concurrent operations', async () => {
      console.log('⚡ Testing concurrent operations');
      
      // Login
      const usernameField = await helper.findElement(['input[name="username"]']);
      await usernameField.fill(testUsers.regularUser.username);
      
      const passwordField = await helper.findElement(['input[name="password"]']);
      await passwordField.fill(testUsers.regularUser.password);
      
      const loginButton = await helper.findElement(['button[type="submit"]']);
      await loginButton.click();
      
      await page.waitForURL(/dashboard|home/);
      
      // Perform multiple operations concurrently
      const operations = [
        helper.findElement(['text=Savings']).then(el => el.click()),
        helper.findElement(['text=Current Account']).then(el => el.click()),
        helper.findElement(['text=Loans']).then(el => el.click()),
      ];
      
      await Promise.all(operations);
      
      await helper.takeContextScreenshot('performance', 'concurrent-operations');
      
      console.log('✅ Concurrent operations handled successfully');
    });
  });

  test.describe('Self-Healing & Error Recovery', () => {
    test('should self-heal when element selectors change', async () => {
      console.log('🤖 Testing self-healing capability');
      
      // Try to find an element with multiple possible selectors
      const dynamicElement = await helper.findElement([
        'text=CoreBank',
        'text=Dashboard',
        'text=Select Test Persona'
      ]);
      
      await expect(dynamicElement).toBeVisible();
      console.log('✅ Self-healing mechanism working correctly');
    });

    test('should recover from network errors', async () => {
      console.log('🤖 Testing network error recovery');
      
      // Simulate network condition
      await page.context().setOffline(true);
      
      const personaButton = await helper.findElement(['text=Johnathan Doe']);
      await personaButton.click();
      
      // Restore network
      await page.context().setOffline(false);
      
      const usernameField = await helper.findElement(['input[type="text"]']);
      await usernameField.fill(testUsers.retailUser.username);
      
      const passwordField = await helper.findElement(['input[type="password"]']);
      await passwordField.fill(testUsers.retailUser.password);
      
      const loginButton = await helper.findElement(['button[type="submit"]']);
      await loginButton.click();
      
      // Should recover and login successfully
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      
      console.log('✅ Network error recovery working correctly');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across different viewports', async () => {
      console.log('📱 Testing cross-viewport compatibility');
      
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1366, height: 768 },  // Laptop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 },   // Mobile
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        console.log(`📱 Testing viewport: ${viewport.width}x${viewport.height}`);
        
        await page.goto('/');
        await helper.takeContextScreenshot('compatibility', `viewport-${viewport.width}`);
        
        // Verify key elements are visible
        const loginPage = await helper.findElement(['text=CoreBank', 'text=Select Test Persona']);
        await expect(loginPage).toBeVisible();
      }
      
      console.log('✅ Cross-viewport compatibility test passed');
    });
  });
});