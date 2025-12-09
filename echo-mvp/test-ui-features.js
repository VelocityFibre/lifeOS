#!/usr/bin/env node

/**
 * UI Features Integration Test
 *
 * Tests the frontend UI features by verifying:
 * 1. Frontend is serving the application
 * 2. API integration is working
 * 3. Chat functionality works end-to-end
 * 4. Error handling and loading states work
 *
 * Since browser automation is blocked by sandbox restrictions,
 * we test by verifying the API endpoints and checking the
 * frontend code structure.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:8081';
const BACKEND_URL = 'http://localhost:3002';

// Simple HTTP request wrapper
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = {
          status: res.statusCode,
          data: res.headers['content-type']?.includes('application/json')
            ? JSON.parse(data)
            : data
        };
        resolve(response);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }

    req.end();
  });
}

class UIFeatureTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async test(description, testFn) {
    try {
      await testFn();
      this.passed++;
      this.results.push({ description, passed: true });
      this.log(`✅ ${description}`, 'success');
      return true;
    } catch (error) {
      this.failed++;
      this.results.push({ description, passed: false, error: error.message });
      this.log(`❌ ${description}`, 'error');
      this.log(`   Error: ${error.message}`, 'error');
      return false;
    }
  }

  async testFrontendServing() {
    await this.test('Frontend server is serving on port 8081', async () => {
      const response = await httpRequest(FRONTEND_URL, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
    });
  }

  async testFrontendHasHTMLContent() {
    await this.test('Frontend serves HTML content with proper structure', async () => {
      const response = await httpRequest(FRONTEND_URL, { timeout: 5000 });
      const html = response.data;

      // Check for essential HTML elements
      if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
        throw new Error('Response does not contain HTML');
      }

      // Check for React app root
      if (!html.includes('root') && !html.includes('app')) {
        throw new Error('HTML does not contain app root element');
      }
    });
  }

  async testBackendHealthCheck() {
    await this.test('Backend health endpoint responds correctly', async () => {
      const response = await httpRequest(`${BACKEND_URL}/health`, { timeout: 5000 });
      if (response.data.status !== 'ok') {
        throw new Error('Backend health check failed');
      }
    });
  }

  async testChatEndpointWithDemoMode() {
    await this.test('Chat endpoint works in demo mode', async () => {
      const response = await httpRequest(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          message: 'Show my unread emails',
          accessToken: 'demo',
          threadId: 'test-thread-ui'
        },
        timeout: 30000
      });

      if (!response.data.success) {
        throw new Error('Chat endpoint returned success=false');
      }

      if (!response.data.text) {
        throw new Error('Chat endpoint returned empty response');
      }

      if (!response.data.threadId) {
        throw new Error('Chat endpoint did not return threadId');
      }
    });
  }

  async testChatEndpointReturnsFormattedResponse() {
    await this.test('Agent responses contain markdown formatting', async () => {
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: 'Show my unread emails',
        accessToken: 'demo',
        threadId: 'test-thread-formatting'
      }, { timeout: 30000 });

      const text = response.data.text;

      // Check for markdown formatting (bold, lists, etc.)
      if (!text.includes('**') && !text.includes('*') && !text.includes('-') && !text.includes('\n')) {
        throw new Error('Response does not appear to contain markdown formatting');
      }
    });
  }

  async testChatEndpointHandlesMultipleMessages() {
    await this.test('Chat endpoint maintains thread context', async () => {
      const threadId = `test-thread-${Date.now()}`;

      // Send first message
      const response1 = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: 'Show my unread emails',
        accessToken: 'demo',
        threadId
      }, { timeout: 30000 });

      if (!response1.data.success) {
        throw new Error('First message failed');
      }

      // Send second message with same thread
      const response2 = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: 'Search for emails about invoice',
        accessToken: 'demo',
        threadId: response1.data.threadId
      }, { timeout: 30000 });

      if (!response2.data.success) {
        throw new Error('Second message failed');
      }

      // Thread ID should be consistent
      if (response1.data.threadId !== response2.data.threadId) {
        throw new Error('Thread ID changed between messages');
      }
    });
  }

  async testErrorHandlingForInvalidRequest() {
    await this.test('API handles invalid requests with proper error messages', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/chat`, {
          // Missing required fields
        }, { timeout: 5000 });
        throw new Error('Should have thrown an error for invalid request');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // This is the expected behavior
          return;
        }
        throw error;
      }
    });
  }

  async testLoadingStateSimulation() {
    await this.test('Loading state can be simulated (async message processing)', async () => {
      const startTime = Date.now();

      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: 'Show my unread emails',
        accessToken: 'demo',
        threadId: 'test-thread-loading'
      }, { timeout: 30000 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.data.success) {
        throw new Error('Message failed');
      }

      // Response should take some time (indicating processing)
      if (duration < 100) {
        throw new Error('Response was instant, no processing time');
      }

      this.log(`   Processing time: ${duration}ms`, 'info');
    });
  }

  async verifyFrontendCodeStructure() {
    await this.test('App.tsx contains setup screen with backend status', async () => {
      const appPath = path.join(__dirname, 'expo-app/App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf-8');

      if (!appContent.includes('showSetup')) {
        throw new Error('App.tsx missing setup screen logic');
      }

      if (!appContent.includes('backendConnected')) {
        throw new Error('App.tsx missing backend connection status');
      }

      if (!appContent.includes('Skip (Demo Mode)')) {
        throw new Error('App.tsx missing demo mode option');
      }
    });
  }

  async verifyEmailChatScreen() {
    await this.test('EmailChat.tsx has proper chat interface structure', async () => {
      const chatPath = path.join(__dirname, 'expo-app/src/screens/EmailChat.tsx');
      const chatContent = fs.readFileSync(chatPath, 'utf-8');

      if (!chatContent.includes('GiftedChat')) {
        throw new Error('EmailChat missing GiftedChat component');
      }

      if (!chatContent.includes('onSend')) {
        throw new Error('EmailChat missing message send handler');
      }

      if (!chatContent.includes('isTyping')) {
        throw new Error('EmailChat missing typing indicator');
      }

      if (!chatContent.includes('renderSend')) {
        throw new Error('EmailChat missing send button customization');
      }
    });
  }

  async verifyChatStore() {
    await this.test('Chat store has proper state management', async () => {
      const storePath = path.join(__dirname, 'expo-app/src/store/chatStore.ts');
      const storeContent = fs.readFileSync(storePath, 'utf-8');

      if (!storeContent.includes('sendMessage')) {
        throw new Error('Chat store missing sendMessage function');
      }

      if (!storeContent.includes('isLoading')) {
        throw new Error('Chat store missing loading state');
      }

      if (!storeContent.includes('accessToken')) {
        throw new Error('Chat store missing accessToken state');
      }

      if (!storeContent.includes('Welcome to Echo Email')) {
        throw new Error('Chat store missing welcome message');
      }

      // Check error handling
      if (!storeContent.includes('catch (error')) {
        throw new Error('Chat store missing error handling');
      }
    });
  }

  async verifyAPILayer() {
    await this.test('API layer is properly configured', async () => {
      const apiPath = path.join(__dirname, 'expo-app/src/api/mastra.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf-8');

      if (!apiContent.includes('http://localhost:3002')) {
        throw new Error('API not configured for correct backend port');
      }

      if (!apiContent.includes('sendMessageToAgent')) {
        throw new Error('API missing sendMessageToAgent function');
      }

      if (!apiContent.includes('checkHealth')) {
        throw new Error('API missing checkHealth function');
      }

      if (!apiContent.includes('timeout')) {
        throw new Error('API missing timeout configuration');
      }
    });
  }

  async testEmailDataDisplay() {
    await this.test('Email data displays with proper format', async () => {
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: 'Show my unread emails',
        accessToken: 'demo',
        threadId: 'test-thread-email-display'
      }, { timeout: 30000 });

      const text = response.data.text;

      // Check for email structure in response
      if (!text.includes('From:') && !text.includes('from:')) {
        throw new Error('Response does not contain sender information');
      }

      if (!text.includes('Subject:') && !text.includes('subject:')) {
        throw new Error('Response does not contain subject information');
      }
    });
  }

  async runAllTests() {
    this.log('\n========================================', 'info');
    this.log('   UI Features Integration Test', 'info');
    this.log('========================================\n', 'info');

    this.log('=== Server Connectivity Tests ===\n', 'info');
    await this.testFrontendServing();
    await this.testFrontendHasHTMLContent();
    await this.testBackendHealthCheck();

    this.log('\n=== Chat Functionality Tests ===\n', 'info');
    await this.testChatEndpointWithDemoMode();
    await this.testChatEndpointReturnsFormattedResponse();
    await this.testChatEndpointHandlesMultipleMessages();
    await this.testEmailDataDisplay();

    this.log('\n=== Error Handling Tests ===\n', 'info');
    await this.testErrorHandlingForInvalidRequest();
    await this.testLoadingStateSimulation();

    this.log('\n=== Code Structure Verification ===\n', 'info');
    await this.verifyFrontendCodeStructure();
    await this.verifyEmailChatScreen();
    await this.verifyChatStore();
    await this.verifyAPILayer();

    this.printSummary();
  }

  printSummary() {
    this.log('\n========================================', 'info');
    this.log('   Test Summary', 'info');
    this.log('========================================\n', 'info');

    this.log(`Total Tests: ${this.passed + this.failed}`, 'info');
    this.log(`Passed: ${this.passed}`, 'success');
    this.log(`Failed: ${this.failed}`, this.failed > 0 ? 'error' : 'success');
    this.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%\n`, 'info');

    if (this.failed > 0) {
      this.log('Failed Tests:', 'error');
      this.results.filter(r => !r.passed).forEach(r => {
        this.log(`  - ${r.description}`, 'error');
      });
    }

    this.log('========================================\n', 'info');
  }
}

// Run tests
const tester = new UIFeatureTester();
tester.runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
