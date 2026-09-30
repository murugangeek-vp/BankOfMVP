import http from 'http';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Real-time Test Monitoring Server
 * Provides live test execution monitoring with WebSocket updates
 */

class TestMonitorServer {
  constructor(port = 3001) {
    this.wss = null;
    this.clients = new Set();
    this.testResults = [];
    this.currentTest = null;

    const server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
    
    server.listen(port, () => {
      console.log(`🚀 Test Monitor Server running on http://localhost:${port}`);
      console.log(`📡 WebSocket server ready for connections`);
    });
  }

  handleHttpRequest(req, res) {
    if (req.url === '/') {
      this.serveDashboard(res);
    } else if (req.url === '/api/results') {
      this.serveResults(res);
    } else if (req.url === '/api/status') {
      this.serveStatus(res);
    } else if (req.url === '/api/run-tests' && req.method === 'POST') {
      this.runTests();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'started' }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  serveDashboard(res) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BankOfMVP Test Monitor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
        }
        .stat-total { color: #667eea; }
        .stat-passed { color: #10b981; }
        .stat-failed { color: #ef4444; }
        .stat-running { color: #f59e0b; }
        .test-list {
            padding: 30px;
            max-height: 600px;
            overflow-y: auto;
        }
        .test-item {
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #ccc;
        }
        .test-item.passed { border-left-color: #10b981; }
        .test-item.failed { border-left-color: #ef4444; }
        .test-item.running { border-left-color: #f59e0b; }
        .test-item.skipped { border-left-color: #6b7280; }
        .test-name {
            flex: 1;
            font-weight: 500;
        }
        .test-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .status-passed { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .status-running { background: #fef3c7; color: #92400e; }
        .status-skipped { background: #e5e7eb; color: #374151; }
        .test-duration {
            color: #666;
            font-size: 0.9em;
            margin-left: 15px;
        }
        .current-test {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left-color: #f59e0b;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .controls {
            padding: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            background: #f8f9fa;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }
        .btn-secondary:hover {
            background: #d1d5db;
        }
        .screenshot-preview {
            max-width: 200px;
            max-height: 150px;
            border-radius: 8px;
            margin-left: 15px;
            cursor: pointer;
        }
        .error-message {
            color: #ef4444;
            font-size: 0.9em;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 BankOfMVP Test Monitor</h1>
            <p>Real-time E2E Test Execution Dashboard</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Tests</div>
                <div class="stat-value stat-total" id="total-tests">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Passed</div>
                <div class="stat-value stat-passed" id="passed-tests">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Failed</div>
                <div class="stat-value stat-failed" id="failed-tests">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Running</div>
                <div class="stat-value stat-running" id="running-tests">0</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="runTests()">▶️ Run Tests</button>
            <button class="btn btn-secondary" onclick="clearResults()">🗑️ Clear Results</button>
            <button class="btn btn-secondary" onclick="refreshStatus()">🔄 Refresh</button>
        </div>
        
        <div class="test-list" id="test-list">
            <div style="text-align: center; color: #666; padding: 40px;">
                No tests executed yet. Click "Run Tests" to start.
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:3001');
        let testResults = [];
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'test-start') {
                updateTestStatus(data.test, 'running');
            } else if (data.type === 'test-complete') {
                updateTestStatus(data.test, data.status, data.duration, data.screenshot, data.error);
            } else if (data.type === 'results') {
                testResults = data.results;
                renderTestList();
            }
        };
        
        function updateTestStatus(testName, status, duration = 0, screenshot = null, error = null) {
            const existingIndex = testResults.findIndex(t => t.test === testName);
            
            if (existingIndex >= 0) {
                testResults[existingIndex] = {
                    ...testResults[existingIndex],
                    status,
                    duration,
                    screenshot,
                    error
                };
            } else {
                testResults.push({
                    test: testName,
                    status,
                    duration,
                    timestamp: new Date().toISOString(),
                    screenshot,
                    error
                });
            }
            
            renderTestList();
            updateStats();
        }
        
        function renderTestList() {
            const listElement = document.getElementById('test-list');
            
            if (testResults.length === 0) {
                listElement.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">No tests executed yet. Click "Run Tests" to start.</div>';
                return;
            }
            
            listElement.innerHTML = testResults.map(result => {
                const isRunning = result.status === 'running';
                const statusClass = result.status;
                const statusText = result.status.charAt(0).toUpperCase() + result.status.slice(1);
                
                return \`
                    <div class="test-item \${statusClass} \${isRunning ? 'current-test' : ''}">
                        <div class="test-name">\${result.test}</div>
                        <div class="test-status status-\${statusClass}">\${statusText}</div>
                        <div class="test-duration">\${result.duration > 0 ? result.duration + 'ms' : ''}</div>
                        \${result.screenshot ? \`<img src="\${result.screenshot}" class="screenshot-preview" onclick="window.open('\${result.screenshot}')">\` : ''}
                        \${result.error ? \`<div class="error-message">\${result.error}</div>\` : ''}
                    </div>
                \`;
            }).join('');
        }
        
        function updateStats() {
            const total = testResults.length;
            const passed = testResults.filter(t => t.status === 'passed').length;
            const failed = testResults.filter(t => t.status === 'failed').length;
            const running = testResults.filter(t => t.status === 'running').length;
            
            document.getElementById('total-tests').textContent = total;
            document.getElementById('passed-tests').textContent = passed;
            document.getElementById('failed-tests').textContent = failed;
            document.getElementById('running-tests').textContent = running;
        }
        
        function runTests() {
            fetch('/api/run-tests', { method: 'POST' })
                .then(response => response.json())
                .then(data => console.log('Tests started:', data))
                .catch(error => console.error('Error starting tests:', error));
        }
        
        function clearResults() {
            testResults = [];
            renderTestList();
            updateStats();
        }
        
        function refreshStatus() {
            fetch('/api/results')
                .then(response => response.json())
                .then(data => {
                    testResults = data;
                    renderTestList();
                    updateStats();
                })
                .catch(error => console.error('Error fetching results:', error));
        }
        
        // Auto-refresh every 5 seconds
        setInterval(refreshStatus, 5000);
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveResults(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.testResults));
  }

  serveStatus(res) {
    const status = {
      total: this.testResults.length,
      passed: this.testResults.filter(t => t.status === 'passed').length,
      failed: this.testResults.filter(t => t.status === 'failed').length,
      running: this.testResults.filter(t => t.status === 'running').length,
      currentTest: this.currentTest
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('📱 New client connected');
      this.clients.add(ws);
      
      // Send current results to new client
      ws.send(JSON.stringify({
        type: 'results',
        results: this.testResults
      }));
      
      ws.on('close', () => {
        console.log('📱 Client disconnected');
        this.clients.delete(ws);
      });
    });
  }

  broadcast(message) {
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }

  updateTestStatus(testName, status, duration, screenshot, error) {
    const timestamp = new Date().toISOString();
    
    if (status === 'running') {
      this.currentTest = { test: testName, status, duration: 0, timestamp };
      this.broadcast({ type: 'test-start', test: testName });
    } else {
      const testResult = {
        test: testName,
        status,
        duration: duration || 0,
        timestamp,
        screenshot,
        error
      };
      
      this.testResults.push(testResult);
      this.currentTest = null;
      
      this.broadcast({
        type: 'test-complete',
        test: testName,
        status,
        duration,
        screenshot,
        error
      });
    }
  }

  runTests() {
    console.log('🚀 Starting test execution...');
    
    const testProcess = spawn('npx', ['playwright', 'test'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      this.parseTestOutput(output);
    });

    testProcess.on('close', (code) => {
      console.log(`✅ Test execution completed with code ${code}`);
      this.broadcast({ type: 'execution-complete', code });
    });
  }

  parseTestOutput(output) {
    // Parse Playwright output to extract test information
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Look for test start patterns
      const startMatch = line.match(/running (\d+) tests?/i);
      if (startMatch) {
        console.log('📊 Test execution started');
      }
      
      // Look for individual test patterns
      const testMatch = line.match(/✓|✗|⟳/);
      if (testMatch) {
        // Extract test name and status
        const testName = line.replace(/[✓✗⟳]/, '').trim();
        const status = line.includes('✓') ? 'passed' : 
                      line.includes('✗') ? 'failed' : 'running';
        
        if (testName) {
          this.updateTestStatus(testName, status);
        }
      }
    }
  }
}

// Start the monitoring server
const monitor = new TestMonitorServer(3001);