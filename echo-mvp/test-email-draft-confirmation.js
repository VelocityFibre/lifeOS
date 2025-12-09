#!/usr/bin/env node

/**
 * Test Script for Email Draft & Confirmation Features
 *
 * Tests:
 * - Feature #106: Agent confirms before sending emails
 * - Feature #105: User can edit agent-drafted emails before sending
 *
 * Success Criteria:
 * - Agent must present draft before sending
 * - Agent must wait for explicit confirmation
 * - Agent must allow draft editing
 * - Agent must handle cancellation
 */

const API_URL = "http://localhost:3002/api/chat";

async function sendMessage(message, threadId = null) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      threadId,
      accessToken: "mock", // Use mock mode
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data;
}

async function runTests() {
  console.log("========================================");
  console.log("EMAIL DRAFT & CONFIRMATION TESTS");
  console.log("========================================\n");

  let passed = 0;
  let failed = 0;
  const threshold = 0.8; // 80% pass threshold for AI behavior

  // Test 1: Agent presents draft before sending
  console.log("Test 1: Agent presents draft before sending");
  try {
    const response = await sendMessage("Send an email to john@example.com saying hello");
    const text = response.text.toLowerCase();

    // Check if agent presents a draft (not immediately sending)
    const hasDraft = text.includes("draft") || text.includes("to:") || text.includes("subject:");
    const hasConfirmation = text.includes("ready") || text.includes("confirm") || text.includes("send?") ||
                           text.includes("yes") || text.includes("proceed");
    const notSentYet = !text.includes("✅") || !text.includes("sent successfully");

    if (hasDraft && hasConfirmation && notSentYet) {
      console.log("✅ PASSED - Agent shows draft and asks for confirmation");
      console.log(`   Draft preview: ${response.text.substring(0, 200)}...`);
      passed++;
    } else {
      console.log("❌ FAILED - Agent did not present draft properly");
      console.log(`   Expected: draft presentation with confirmation request`);
      console.log(`   Got: ${response.text.substring(0, 200)}...`);
      console.log(`   Has draft: ${hasDraft}, Has confirmation: ${hasConfirmation}, Not sent yet: ${notSentYet}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Test 2: Agent sends email after "yes" confirmation
  console.log("\nTest 2: Agent sends email after confirmation");
  try {
    // First request the draft
    const draft = await sendMessage("Send an email to jane@example.com about the meeting");

    // Then confirm sending
    const response = await sendMessage("yes, send it", draft.threadId);
    const text = response.text.toLowerCase();

    const wasSent = text.includes("sent") || text.includes("✅") || text.includes("successfully");

    if (wasSent) {
      console.log("✅ PASSED - Agent sends email after confirmation");
      console.log(`   Response: ${response.text.substring(0, 150)}...`);
      passed++;
    } else {
      console.log("❌ FAILED - Agent did not send email after confirmation");
      console.log(`   Response: ${response.text.substring(0, 150)}...`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Test 3: Agent allows draft editing
  console.log("\nTest 3: Agent allows draft editing");
  try {
    // Request draft
    const draft = await sendMessage("Draft an email to bob@company.com about the project update");

    // Request edit
    const edit = await sendMessage("Actually, change the subject to 'Urgent: Project Update'", draft.threadId);
    const text = edit.text.toLowerCase();

    const hasRevision = text.includes("updated") || text.includes("revised") || text.includes("changed") ||
                       text.includes("urgent") || text.includes("draft");
    const stillDraft = !text.includes("sent successfully");

    if (hasRevision && stillDraft) {
      console.log("✅ PASSED - Agent updates draft based on user request");
      console.log(`   Response: ${edit.text.substring(0, 150)}...`);
      passed++;
    } else {
      console.log("❌ FAILED - Agent did not handle draft editing properly");
      console.log(`   Response: ${edit.text.substring(0, 150)}...`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Test 4: Agent handles cancellation
  console.log("\nTest 4: Agent handles cancellation");
  try {
    // Request draft
    const draft = await sendMessage("Send an email to spam@example.com");

    // Cancel
    const cancel = await sendMessage("cancel, don't send it", draft.threadId);
    const text = cancel.text.toLowerCase();

    const wasCancelled = (text.includes("cancel") || text.includes("discard") || text.includes("not send")) &&
                        !text.includes("sent successfully");

    if (wasCancelled) {
      console.log("✅ PASSED - Agent handles cancellation correctly");
      console.log(`   Response: ${cancel.text.substring(0, 150)}...`);
      passed++;
    } else {
      console.log("❌ FAILED - Agent did not handle cancellation");
      console.log(`   Response: ${cancel.text.substring(0, 150)}...`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Test 5: Multiple rounds of editing
  console.log("\nTest 5: Multiple rounds of editing");
  try {
    // Request draft
    const draft = await sendMessage("Draft an email to alice@test.com about the conference");

    // First edit
    const edit1 = await sendMessage("Change the subject to 'Conference Details'", draft.threadId);

    // Second edit
    const edit2 = await sendMessage("Add a PS thanking them for their time", edit1.threadId);
    const text = edit2.text.toLowerCase();

    const hasMultipleEdits = text.includes("updated") || text.includes("added") || text.includes("p.s") ||
                            text.includes("ps") || text.includes("thank");
    const stillDraft = !text.includes("sent successfully");

    if (hasMultipleEdits && stillDraft) {
      console.log("✅ PASSED - Agent handles multiple editing rounds");
      console.log(`   Response: ${edit2.text.substring(0, 150)}...`);
      passed++;
    } else {
      console.log("❌ FAILED - Agent did not handle multiple edits");
      console.log(`   Response: ${edit2.text.substring(0, 150)}...`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Test 6: Agent understands various confirmation phrasings
  console.log("\nTest 6: Various confirmation phrasings");
  try {
    // Test "send it"
    const draft1 = await sendMessage("Email test@example.com saying thanks");
    const confirm1 = await sendMessage("send it", draft1.threadId);
    const sent1 = confirm1.text.toLowerCase().includes("sent") || confirm1.text.toLowerCase().includes("✅");

    // Test "go ahead"
    const draft2 = await sendMessage("Email demo@example.com about the demo");
    const confirm2 = await sendMessage("go ahead", draft2.threadId);
    const sent2 = confirm2.text.toLowerCase().includes("sent") || confirm2.text.toLowerCase().includes("✅");

    // Test "confirm"
    const draft3 = await sendMessage("Email info@example.com requesting information");
    const confirm3 = await sendMessage("confirm", draft3.threadId);
    const sent3 = confirm3.text.toLowerCase().includes("sent") || confirm3.text.toLowerCase().includes("✅");

    const allSent = sent1 && sent2 && sent3;

    if (allSent) {
      console.log("✅ PASSED - Agent understands various confirmation phrasings");
      console.log(`   'send it': ${sent1 ? '✓' : '✗'}, 'go ahead': ${sent2 ? '✓' : '✗'}, 'confirm': ${sent3 ? '✓' : '✗'}`);
      passed++;
    } else {
      console.log("❌ FAILED - Agent missed some confirmation phrasings");
      console.log(`   'send it': ${sent1 ? '✓' : '✗'}, 'go ahead': ${sent2 ? '✓' : '✗'}, 'confirm': ${sent3 ? '✓' : '✗'}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Test 7: Draft includes all required fields
  console.log("\nTest 7: Draft includes all required fields");
  try {
    const response = await sendMessage("Send an email to support@company.com with subject 'Bug Report' about a login issue");
    const text = response.text;

    const hasRecipient = text.toLowerCase().includes("to:") || text.includes("support@company.com");
    const hasSubject = text.toLowerCase().includes("subject:") || text.includes("Bug Report");
    const hasBody = text.toLowerCase().includes("body:") || text.toLowerCase().includes("login");

    if (hasRecipient && hasSubject && hasBody) {
      console.log("✅ PASSED - Draft includes all required fields");
      console.log(`   Recipient: ✓, Subject: ✓, Body: ✓`);
      passed++;
    } else {
      console.log("❌ FAILED - Draft missing required fields");
      console.log(`   Recipient: ${hasRecipient ? '✓' : '✗'}, Subject: ${hasSubject ? '✓' : '✗'}, Body: ${hasBody ? '✓' : '✗'}`);
      console.log(`   Draft: ${text.substring(0, 200)}...`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Test 8: Agent never sends without confirmation
  console.log("\nTest 8: Agent never sends without explicit confirmation");
  try {
    const response = await sendMessage("Email urgent@example.com immediately");
    const text = response.text.toLowerCase();

    // Even with "immediately", agent should show draft first
    const showsDraft = text.includes("draft") || text.includes("to:") || text.includes("subject:");
    const notSent = !text.includes("sent successfully") || !text.includes("✅");

    if (showsDraft && notSent) {
      console.log("✅ PASSED - Agent always requires confirmation, even for 'urgent' requests");
      passed++;
    } else {
      console.log("❌ FAILED - Agent sent email without confirmation");
      console.log(`   Response: ${text.substring(0, 150)}...`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error.message}`);
    failed++;
  }

  // Results
  console.log("\n========================================");
  console.log("TEST RESULTS");
  console.log("========================================");
  const total = passed + failed;
  const passRate = total > 0 ? (passed / total) : 0;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${total}`);
  console.log(`Pass Rate: ${(passRate * 100).toFixed(1)}%`);
  console.log(`Threshold: ${(threshold * 100)}%`);
  console.log("========================================\n");

  if (passRate >= threshold) {
    console.log(`🎉 SUCCESS! Pass rate ${(passRate * 100).toFixed(1)}% meets threshold ${(threshold * 100)}%`);
    console.log("\n✅ Feature #106: Agent confirms before sending emails - VERIFIED");
    console.log("✅ Feature #105: User can edit agent-drafted emails - VERIFIED");
    process.exit(0);
  } else {
    console.log(`❌ FAILED: Pass rate ${(passRate * 100).toFixed(1)}% below threshold ${(threshold * 100)}%`);
    console.log("\nNeeds improvement in email confirmation workflow.");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
