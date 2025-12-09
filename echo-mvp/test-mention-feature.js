#!/usr/bin/env node

/**
 * Test script for @mention functionality
 * Tests Features #19 and #20 from feature_list.json
 */

const http = require("http");

// Test configuration
// Using port 3003 for testing the updated code with @mention routing
const BASE_URL = "http://localhost:3003";

// Utility to make HTTP requests
function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {},
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test cases
async function runTests() {
  console.log("\x1b[34m");
  console.log("========================================");
  console.log("   @mention Functionality Tests");
  console.log("========================================\x1b[0m");
  console.log("");

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: @mail mention works
  console.log("\x1b[36mTest 1: @mail agent can be invoked with @mention\x1b[0m");
  try {
    const response = await makeRequest("/api/chat", "POST", {
      message: "@mail show my recent emails",
      accessToken: "mock",
      threadId: "test-mention-1",
    });

    if (response.status === 200 && response.data.success) {
      console.log("\x1b[33m  Response:\x1b[0m", response.data.text.substring(0, 100) + "...");
      console.log("\x1b[32m✅ PASSED\x1b[0m");
      passedTests++;
    } else {
      console.log("\x1b[31m❌ FAILED - Invalid response\x1b[0m");
      failedTests++;
    }
  } catch (error) {
    console.log("\x1b[31m❌ FAILED -", error.message, "\x1b[0m");
    failedTests++;
  }
  console.log("");

  // Test 2: @cal mention returns "coming soon" message
  console.log("\x1b[36mTest 2: @cal mention shows coming soon message\x1b[0m");
  try {
    const response = await makeRequest("/api/chat", "POST", {
      message: "@cal show my schedule",
      accessToken: "mock",
      threadId: "test-mention-2",
    });

    if (
      response.status === 200 &&
      response.data.success &&
      response.data.text.includes("coming soon")
    ) {
      console.log("\x1b[33m  Response:\x1b[0m", response.data.text);
      console.log("\x1b[32m✅ PASSED\x1b[0m");
      passedTests++;
    } else {
      console.log("\x1b[31m❌ FAILED - Expected coming soon message\x1b[0m");
      failedTests++;
    }
  } catch (error) {
    console.log("\x1b[31m❌ FAILED -", error.message, "\x1b[0m");
    failedTests++;
  }
  console.log("");

  // Test 3: @mem mention returns "coming soon" message
  console.log("\x1b[36mTest 3: @mem mention shows coming soon message\x1b[0m");
  try {
    const response = await makeRequest("/api/chat", "POST", {
      message: "@mem remember this important note",
      accessToken: "mock",
      threadId: "test-mention-3",
    });

    if (
      response.status === 200 &&
      response.data.success &&
      response.data.text.includes("coming soon")
    ) {
      console.log("\x1b[33m  Response:\x1b[0m", response.data.text);
      console.log("\x1b[32m✅ PASSED\x1b[0m");
      passedTests++;
    } else {
      console.log("\x1b[31m❌ FAILED - Expected coming soon message\x1b[0m");
      failedTests++;
    }
  } catch (error) {
    console.log("\x1b[31m❌ FAILED -", error.message, "\x1b[0m");
    failedTests++;
  }
  console.log("");

  // Test 4: Message without @mention works (defaults to @mail)
  console.log("\x1b[36mTest 4: Message without @mention defaults to @mail\x1b[0m");
  try {
    const response = await makeRequest("/api/chat", "POST", {
      message: "show my unread emails",
      accessToken: "mock",
      threadId: "test-mention-4",
    });

    if (response.status === 200 && response.data.success) {
      console.log("\x1b[33m  Response:\x1b[0m", response.data.text.substring(0, 100) + "...");
      console.log("\x1b[32m✅ PASSED\x1b[0m");
      passedTests++;
    } else {
      console.log("\x1b[31m❌ FAILED - Should default to @mail agent\x1b[0m");
      failedTests++;
    }
  } catch (error) {
    console.log("\x1b[31m❌ FAILED -", error.message, "\x1b[0m");
    failedTests++;
  }
  console.log("");

  // Test 5: @mail mention is removed from query
  console.log("\x1b[36mTest 5: @mail mention is cleaned from query\x1b[0m");
  try {
    const response = await makeRequest("/api/chat", "POST", {
      message: "@mail search for emails from john",
      accessToken: "mock",
      threadId: "test-mention-5",
    });

    if (
      response.status === 200 &&
      response.data.success &&
      !response.data.text.includes("@mail")
    ) {
      console.log("\x1b[33m  Response:\x1b[0m", response.data.text.substring(0, 100) + "...");
      console.log("\x1b[32m✅ PASSED - @mail removed from query\x1b[0m");
      passedTests++;
    } else {
      console.log("\x1b[31m❌ FAILED - @mail should be removed from query\x1b[0m");
      failedTests++;
    }
  } catch (error) {
    console.log("\x1b[31m❌ FAILED -", error.message, "\x1b[0m");
    failedTests++;
  }
  console.log("");

  // Summary
  console.log("\x1b[34m========================================\x1b[0m");
  console.log("\x1b[34mTest Results Summary\x1b[0m");
  console.log("\x1b[34m========================================\x1b[0m");
  console.log("\x1b[36mTotal Tests: " + (passedTests + failedTests) + "\x1b[0m");
  console.log("\x1b[32mPassed: " + passedTests + "\x1b[0m");
  console.log(
    failedTests > 0 ? "\x1b[31mFailed: " + failedTests + "\x1b[0m" : "\x1b[32mFailed: 0\x1b[0m"
  );
  console.log("\x1b[34m========================================\x1b[0m");

  if (passedTests === 5) {
    console.log("\x1b[32m");
    console.log("🎉 All tests passed!");
    console.log("Features #19 (@mention invocation) ready to mark as passing");
    console.log("Frontend autocomplete (Feature #20) implemented but needs UI testing");
    console.log("\x1b[0m");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
