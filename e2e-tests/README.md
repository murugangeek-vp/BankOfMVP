# BankOfMVP E2E Automation Testing Suite

Comprehensive end-to-end automation testing framework for BankOfMVP using Playwright with advanced features including self-healing, visual monitoring, and CI/CD integration.

## 🚀 Features

### Core Capabilities
- **🎯 Business Logic Testing**: Complete coverage of banking workflows
- **🌐 Multi-Browser Support**: Chromium, Firefox, WebKit, and mobile browsers
- **📸 Screenshot & Video Recording**: Automatic capture on test failures
- **🔍 Error Log Analysis**: Browser console and network error monitoring
- **🤖 Self-Healing**: AI-powered element locator recovery
- **👁️ Visual Monitoring**: Interactive test execution with real-time feedback
- **📊 Performance Testing**: Load time and performance metrics
- **🎨 Visual Regression**: UI consistency verification
- **🔄 Retry Mechanism**: Automatic test retry for flaky tests
- **📈 Comprehensive Reporting**: HTML reports with detailed metrics

### Test Coverage
- ✅ Authentication & Security (Login, JWT, Session Management)
- ✅ Personal Banking (Savings, Current Accounts)
- ✅ Corporate Banking (Maker-Checker Workflows)
- ✅ Loan Management (EMI Calculator, Applications)
- ✅ Audit Trail & Compliance (PII Redaction, Audit Logs)
- ✅ Performance & Load Testing (Concurrent Operations)
- ✅ Cross-Browser Compatibility (Responsive Design)
- ✅ Self-Healing & Error Recovery

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Playwright browsers (auto-installed)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

## 🎯 Running Tests

### Interactive Test Runner (Recommended)
```bash
npm run test:interactive
```

This provides a visual menu-driven interface with:
- Real-time test execution monitoring
- Multi-browser testing options
- Debug mode with step-by-step execution
- Performance and visual regression testing
- Test report viewing

### Command Line Options

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests in UI mode (headed)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific browser tests
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run performance tests
npm run test:e2e:performance

# Run visual regression tests
npm run test:e2e:visual

# View test report
npm run test:e2e:report
```

## 📁 Test Structure

```
e2e-tests/
├── bank-mvp-comprehensive.spec.ts    # Main test suite
├── global-setup.ts                   # Test environment setup
├── global-teardown.ts                 # Test environment cleanup
├── utils/
│   └── test-helpers.ts              # Helper utilities
├── run-tests.mjs                     # Interactive test runner
└── README.md                         # This file
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

Key configuration options:
- **Retries**: 1 (local), 2 (CI) for self-healing
- **Workers**: 4 (local), 1 (CI) for parallel execution
- **Reporting**: HTML, JSON, JUnit formats
- **Screenshots**: On failure only
- **Video**: On failure only
- **Traces**: Retain on failure

### Environment Variables

```bash
# Base URL for tests
BASE_URL=http://localhost:3000

# CI mode
CI=true

# Test timeout
TEST_TIMEOUT=30000
```

## 📊 Test Reports

### HTML Report
After test execution, view the detailed HTML report:
```bash
npm run test:e2e:report
```

Or open directly:
```bash
open e2e-results/html-report/index.html
```

### Report Contents
- Test execution timeline
- Screenshot thumbnails
- Video recordings
- Browser console errors
- Network failures
- Performance metrics
- Trace files for debugging

## 🤖 Self-Healing Features

### Smart Element Location
The framework uses multiple strategies to find elements:
1. Primary CSS selectors
2. Fallback selectors
3. Text-based location
4. AI-powered healing

### Example
```typescript
// Multiple selector strategies
const element = await helper.findElement([
  'input[name="username"]',
  'input[type="text"]',
  '#username',
  '[data-testid="username"]'
]);
```

### Error Recovery
- Automatic retry on network failures
- Console error monitoring
- Network error capture
- Page content capture on failure

## 🔄 CI/CD Integration

### GitHub Actions

The `.github/workflows/e2e-tests.yml` provides:

- **Multi-browser testing**: Parallel execution on Chromium, Firefox, WebKit
- **Sharding**: Test distribution for faster execution
- **Artifact uploads**: Screenshots, videos, traces
- **Report generation**: Combined HTML reports
- **PR comments**: Automated test results
- **GitHub Pages**: Report deployment

### Workflow Triggers
- Push to main/develop branches
- Pull requests
- Daily schedule (2 AM UTC)
- Manual workflow dispatch

## 📱 Cross-Browser Testing

### Desktop Browsers
- Chrome/Chromium
- Firefox
- Safari (WebKit)

### Mobile Browsers
- Pixel 5 (Android Chrome)
- iPhone 12 (iOS Safari)

### Responsive Testing
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667

## 🔍 Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```

Features:
- Step-by-step execution
- Inspect element state
- Console log monitoring
- Network request inspection

### Trace Viewer
For failed tests, view detailed traces:
```bash
npx playwright show-trace e2e-results/traces/trace.zip
```

## 📈 Performance Monitoring

### Performance Metrics
- Page load time
- DOM content loaded
- First paint
- First contentful paint
- Network performance
- Resource timing

### Performance Tests
```bash
npm run test:e2e:performance
```

## 🎨 Visual Regression

### Visual Testing
```bash
npm run test:e2e:visual
```

Features:
- Screenshot comparison
- Visual diff generation
- Ignore regions
- Threshold configuration

## 🔒 Security Testing

### Security Features
- Authentication testing
- Authorization verification
- PII redaction validation
- SQL injection prevention
- XSS attack prevention
- Session management

## 📝 Test Writing Guide

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### Using Test Helpers
```typescript
import { TestHelpers } from './utils/test-helpers';

const helper = new TestHelpers(page);
await helper.captureScreenshot('test-name', 'action');
await helper.waitForApplicationStable();
```

### Self-Healing Elements
```typescript
const element = await helper.findElement([
  'primary-selector',
  'fallback-selector',
  'text=Button Text'
]);
```

## 🐛 Troubleshooting

### Common Issues

1. **Application not starting**
   - Ensure `npm start` is running
   - Check port 3000 is available
   - Verify API health endpoint

2. **Browser installation failed**
   - Run `npm run test:e2e:install`
   - Check system dependencies
   - Verify network connectivity

3. **Tests timing out**
   - Increase timeout in config
   - Check application performance
   - Verify network stability

4. **Self-healing not working**
   - Check selector strategies
   - Verify element accessibility
   - Review console logs

## 📞 Support

For issues and questions:
- Check the test logs in `e2e-results/`
- Review screenshots and videos
- Examine browser console errors
- Consult the Playwright documentation

## 🔄 Updates

To update Playwright browsers:
```bash
npx playwright install --with-deps
```

To update dependencies:
```bash
npm update
```

## 📄 License

This testing framework is part of the BankOfMVP project.

---

**Note**: This is a comprehensive E2E testing framework designed for continuous integration and delivery. Ensure your application is running before executing tests.