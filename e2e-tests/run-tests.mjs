#!/usr/bin/env node

/**
 * Interactive Test Runner for BankOfMVP E2E Tests
 * Provides visual monitoring and real-time test execution feedback
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class TestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    this.currentTest = null;
    this.startTime = null;
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  clearScreen() {
    console.clear();
  }

  showHeader() {
    this.clearScreen();
    this.log(`
╔══════════════════════════════════════════════════════════════╗
║                    BankOfMVP E2E Test Runner                  ║
║              Comprehensive Automation Testing Suite            ║
╚══════════════════════════════════════════════════════════════╝
`, colors.cyan);
  }

  showMenu() {
    this.log('\n📋 Available Test Options:\n', colors.bright);
    this.log('1. 🎯 Run All Tests (All Browsers)', colors.green);
    this.log('2. 🌐 Run Chromium Tests Only', colors.blue);
    this.log('3. 🔥 Run Firefox Tests Only', colors.blue);
    this.log('4. 🍎 Run WebKit Tests Only', colors.blue);
    this.log('5. 👁️  Run Tests in UI Mode (Headed)', colors.yellow);
    this.log('6. 🐛 Debug Mode (Interactive)', colors.magenta);
    this.log('7. 📊 Run Performance Tests', colors.cyan);
    this.log('8. 🎨 Run Visual Regression Tests', colors.cyan);
    this.log('9. 📈 View Last Test Report', colors.green);
    this.log('0. 🚪 Exit', colors.red);
    this.log('\n👉 Select an option: ', colors.bright);
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      this.startTime = Date.now();
      this.currentTest = args.join(' ');
      
      this.log(`\n🚀 Executing: ${command} ${args.join(' ')}`, colors.yellow);
      this.log('─'.repeat(60), colors.cyan);

      const process = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      process.on('close', (code) => {
        const duration = Date.now() - this.startTime;
        this.log('─'.repeat(60), colors.cyan);
        
        if (code === 0) {
          this.log(`✅ Command completed successfully in ${(duration / 1000).toFixed(2)}s`, colors.green);
          this.testResults.passed++;
        } else {
          this.log(`❌ Command failed with exit code ${code}`, colors.red);
          this.testResults.failed++;
        }
        
        this.testResults.total++;
        this.testResults.duration += duration;
        resolve(code);
      });

      process.on('error', (error) => {
        this.log(`❌ Process error: ${error.message}`, colors.red);
        reject(error);
      });
    });
  }

  async runAllTests() {
    this.log('\n🎯 Running comprehensive test suite...', colors.bright);
    
    const browsers = ['chromium', 'firefox', 'webkit'];
    for (const browser of browsers) {
      this.log(`\n📱 Running tests on ${browser}...`, colors.cyan);
      await this.runCommand('npx', ['playwright', 'test', '--project', browser]);
    }
    
    this.showResults();
  }

  async runSpecificBrowser(browser) {
    this.log(`\n🌐 Running tests on ${browser}...`, colors.bright);
    await this.runCommand('npx', ['playwright', 'test', '--project', browser]);
    this.showResults();
  }

  async runUITests() {
    this.log('\n👁️  Running tests in UI mode (headed)...', colors.bright);
    await this.runCommand('npx', ['playwright', 'test', '--ui', '--headed']);
    this.showResults();
  }

  async runDebugTests() {
    this.log('\n🐛 Running tests in debug mode...', colors.bright);
    await this.runCommand('npx', ['playwright', 'test', '--debug']);
    this.showResults();
  }

  async runPerformanceTests() {
    this.log('\n📊 Running performance tests...', colors.bright);
    await this.runCommand('npx', ['playwright', 'test', '--grep', '@performance']);
    this.showResults();
  }

  async runVisualTests() {
    this.log('\n🎨 Running visual regression tests...', colors.bright);
    await this.runCommand('npx', ['playwright', 'test', '--grep', '@visual']);
    this.showResults();
  }

  showResults() {
    this.log('\n📊 Test Results Summary:', colors.bright);
    this.log('─'.repeat(60), colors.cyan);
    this.log(`Total Tests: ${this.testResults.total}`, colors.bright);
    this.log(`✅ Passed: ${this.testResults.passed}`, colors.green);
    this.log(`❌ Failed: ${this.testResults.failed}`, colors.red);
    this.log(`⏭️  Skipped: ${this.testResults.skipped}`, colors.yellow);
    this.log(`⏱️  Duration: ${(this.testResults.duration / 1000).toFixed(2)}s`, colors.cyan);
    
    if (this.testResults.total > 0) {
      const passRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
      this.log(`📈 Pass Rate: ${passRate}%`, passRate >= 80 ? colors.green : colors.red);
    }
    
    this.log('─'.repeat(60), colors.cyan);
    this.log('\n📁 Detailed results available in:', colors.bright);
    this.log('   - e2e-results/html-report/index.html', colors.cyan);
    this.log('   - e2e-results/test-results.json', colors.cyan);
    this.log('   - e2e-results/screenshots/', colors.cyan);
    this.log('   - e2e-results/videos/', colors.cyan);
  }

  viewReport() {
    const reportPath = path.join(process.cwd(), 'e2e-results', 'html-report', 'index.html');
    
    if (fs.existsSync(reportPath)) {
      this.log(`\n📈 Opening test report...`, colors.bright);
      
      const start = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';
      
      spawn(start, [reportPath], { stdio: 'inherit' });
    } else {
      this.log('\n❌ No test report found. Run tests first.', colors.red);
    }
  }

  async start() {
    this.showHeader();
    
    while (true) {
      this.showMenu();
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const choice = await new Promise(resolve => {
        rl.question('', resolve);
      });
      
      rl.close();

      switch (choice.trim()) {
        case '1':
          await this.runAllTests();
          break;
        case '2':
          await this.runSpecificBrowser('chromium');
          break;
        case '3':
          await this.runSpecificBrowser('firefox');
          break;
        case '4':
          await this.runSpecificBrowser('webkit');
          break;
        case '5':
          await this.runUITests();
          break;
        case '6':
          await this.runDebugTests();
          break;
        case '7':
          await this.runPerformanceTests();
          break;
        case '8':
          await this.runVisualTests();
          break;
        case '9':
          this.viewReport();
          break;
        case '0':
          this.log('\n👋 Goodbye!', colors.green);
          process.exit(0);
        default:
          this.log('\n❌ Invalid option. Please try again.', colors.red);
      }

      if (choice.trim() !== '0' && choice.trim() !== '9') {
        this.log('\nPress Enter to continue...', colors.cyan);
        const rl2 = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        await new Promise(resolve => {
          rl2.question('', resolve);
          rl2.close();
        });
      }
    }
  }
}

// Start the test runner
const runner = new TestRunner();
runner.start().catch(console.error);