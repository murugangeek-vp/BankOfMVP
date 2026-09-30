# BankOfMVP E2E Testing - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### 2. Start the Application
```bash
# Start BankOfMVP application
npm start
```

### 3. Run Tests

#### Option A: Interactive Mode (Recommended)
```bash
npm run test:interactive
```

This provides a visual menu with:
- 🎯 Run all tests across browsers
- 🌐 Browser-specific testing
- 👁️ Visual headed mode
- 🐛 Debug mode
- 📊 Performance testing
- 🎨 Visual regression tests

#### Option B: Command Line
```bash
# Run all tests (headless)
npm run test:e2e

# Run with visual feedback
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

### 4. Monitor Tests in Real-Time
```bash
# Start monitoring server
npm run test:monitor
```

Then open http://localhost:3001 in your browser to see:
- Real-time test execution
- Live statistics
- Screenshot previews
- Error messages

### 5. View Results
```bash
# Open HTML report
npm run test:e2e:report
```

## 📊 Test Coverage

The test suite covers:

### Authentication & Security
- ✅ Login with valid credentials
- ✅ Invalid credential handling
- ✅ Session management
- ✅ JWT token security

### Personal Banking
- ✅ Savings account operations
- ✅ Current account with overdraft
- ✅ Deposits and withdrawals
- ✅ Balance verification

### Corporate Banking
- ✅ Corporate account access
- ✅ Maker-checker workflows
- ✅ Transaction approvals
- ✅ Authorization controls

### Loan Management
- ✅ EMI calculator
- ✅ Loan applications
- ✅ Loan status tracking
- ✅ Payment processing

### Audit & Compliance
- ✅ Audit trail display
- ✅ PII redaction
- ✅ Compliance verification
- ✅ Security logging

### Performance
- ✅ Page load performance
- ✅ Concurrent operations
- ✅ Rapid navigation
- ✅ Resource usage

## 🤖 Self-Healing Features

The framework automatically handles:
- **Element location**: Multiple selector strategies
- **Network errors**: Automatic retry mechanisms
- **Console errors**: Browser error monitoring
- **Test failures**: Screenshot and video capture
- **Flaky tests**: Configurable retry logic

## 📁 Generated Artifacts

After test execution, you'll find:

```
e2e-results/
├── html-report/          # Interactive HTML report
├── screenshots/          # Failure screenshots
├── videos/              # Failure video recordings
├── traces/              # Debug traces
├── test-results.json    # Machine-readable results
└── test-log.txt         # Execution log
```

## 🔧 Configuration

### Modify Browser Settings
Edit `playwright.config.ts`:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  // Add more browsers...
]
```

### Adjust Test Timeouts
```typescript
use: {
  actionTimeout: 30000,    // 30 seconds
  navigationTimeout: 30000 // 30 seconds
}
```

### Configure Retries
```typescript
retries: process.env.CI ? 2 : 1  // More retries in CI
```

## 🎯 Writing Your Own Tests

### Basic Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    
    // Use self-healing selectors
    const button = await page.locator('text=Submit').or(page.locator('#submit-btn'));
    await button.click();
    
    // Verify result
    await expect(page).toHaveURL(/success/);
  });
});
```

### Using Test Helpers
```typescript
import { TestHelpers } from './utils/test-helpers';

const helper = new TestHelpers(page);

// Capture screenshots
await helper.captureScreenshot('test-name', 'action');

// Wait for stability
await helper.waitForApplicationStable();

// Measure performance
const metrics = await helper.measurePagePerformance('/dashboard');
```

## 🐛 Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```

### View Traces
```bash
npx playwright show-trace e2e-results/traces/trace.zip
```

### Inspect Page State
```typescript
// In debug mode, use page.pause()
await page.pause();

// Capture page content
const content = await page.content();
console.log(content);
```

## 🔄 CI/CD Integration

### GitHub Actions
The workflow is automatically configured in `.github/workflows/e2e-tests.yml`:

- Runs on push/PR to main/develop
- Tests across multiple browsers
- Generates and uploads reports
- Comments on PRs with results

### Manual Trigger
```bash
# Trigger workflow manually
gh workflow run e2e-tests.yml
```

## 📱 Mobile Testing

The suite includes mobile device testing:
- Pixel 5 (Android Chrome)
- iPhone 12 (iOS Safari)

Mobile tests run automatically with the full suite.

## 🎨 Visual Regression

### Run Visual Tests
```bash
npm run test:e2e:visual
```

### Update Baselines
```bash
npx playwright test --grep @visual --update-snapshots
```

## 📊 Performance Testing

### Run Performance Tests
```bash
npm run test:e2e:performance
```

Performance metrics include:
- Page load time
- DOM content loaded
- First paint
- First contentful paint
- Network timing

## 🔍 Common Issues

### "Application not ready"
- Ensure `npm start` is running
- Check ports 3000 and 5000 are available
- Verify API health endpoint

### "Browser installation failed"
```bash
npm run test:e2e:install
```

### "Tests timing out"
- Increase timeout in `playwright.config.ts`
- Check application performance
- Verify network stability

### "Element not found"
- Use self-healing helper methods
- Check selector strategies
- Verify element is visible

## 📞 Getting Help

For detailed documentation, see:
- `e2e-tests/README.md` - Comprehensive guide
- Playwright Docs: https://playwright.dev
- Project issues: Check GitHub Issues

## 🎉 Next Steps

1. ✅ Run the interactive test runner
2. ✅ Explore the monitoring dashboard
3. ✅ Review test reports
4. ✅ Write custom tests for your features
5. ✅ Integrate with your CI/CD pipeline

---

**Happy Testing! 🚀**