import express from "express";
import cors from "cors";
import { mastra } from "../mastra";
import { register, login, logout, verifyToken, optionalAuth, AuthRequest } from "./auth";
import { createMemoryStore } from "../db/pg-memory-store";
import { callAgentsAPI, getAgentId } from "../utils/agent-mapper";

// Validate required environment variables on startup
function validateEnvironment() {
  const requiredVars = ["OPENAI_API_KEY"];
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error("\n❌ ERROR: Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error("\n💡 Please check your .env file in the mastra-backend directory.");
    console.error("   Make sure it contains all required variables.\n");
    process.exit(1);
  }

  // Validate that API key is not a placeholder
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && (apiKey.includes("your-") || apiKey.includes("sk-xxx") || apiKey.length < 20)) {
    console.error("\n❌ ERROR: OPENAI_API_KEY appears to be a placeholder.");
    console.error("   Please set a valid OpenAI API key in your .env file.\n");
    process.exit(1);
  }

  console.log("✅ Environment validation passed");
}

// Run validation before starting server
validateEnvironment();

// Session 7: Added @mention routing for @cal, @mem, and @mail agents
const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// AUTH ENDPOINTS
// ============================================

// Register new user
app.post("/api/auth/register", register);

// Login existing user
app.post("/api/auth/login", login);

// Logout (invalidate session)
app.post("/api/auth/logout", logout);

// ============================================
// CHAT ENDPOINTS
// ============================================

// Main chat endpoint for Expo app
// Uses optionalAuth to support both authenticated users and legacy accessToken flow
app.post("/api/chat", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { message, accessToken, threadId } = req.body;

    // Validate message exists and is a non-empty string
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required and must be a non-empty string" });
    }

    // In dev mode, allow missing token (will use mock data)
    if (!accessToken && process.env.NODE_ENV !== "development") {
      return res.status(401).json({ error: "Gmail access token is required" });
    }

    // Detect explicitly invalid tokens
    // Invalid token patterns: "invalid", "expired", very short tokens, etc.
    // Skip "mock" token in dev mode
    if (accessToken &&
        accessToken !== "mock" &&
        (accessToken.includes("invalid") ||
         accessToken.includes("expired") ||
         (accessToken.length < 10 && process.env.NODE_ENV !== "development"))) {
      return res.status(401).json({
        error: "Invalid or expired access token",
        details: "Please refresh your Gmail authentication"
      });
    }

    // Use "mock" token in dev mode if none provided
    const token = accessToken || "mock";

    // Detect @mention to route to appropriate agent
    // For now, we only support @mail (default), @cal and @mem coming soon
    let cleanedMessage = message;

    // Check for @mentions
    if (message.includes("@cal")) {
      return res.json({
        success: true,
        text: "📅 The @cal (Calendar) agent is coming soon! For now, I can help you with emails using @mail.",
        threadId: threadId || "default-thread",
      });
    } else if (message.includes("@mem")) {
      return res.json({
        success: true,
        text: "🧠 The @mem (Memory) agent is coming soon! For now, I can help you with emails using @mail.",
        threadId: threadId || "default-thread",
      });
    }
    // @mail or no mention - use email agent (default)
    // Remove @mail from message if present
    cleanedMessage = message.replace(/@mail\s*/g, "");

    // Get email agent (only agent available for now)
    const agent = mastra.getAgent("emailAgent");

    // Run agent with context
    // Note: Tools will need accessToken - we'll inject it via system message
    const enrichedMessage = `[System: User's Gmail access token available for tools: ${token}]\n\nUser query: ${cleanedMessage}`;

    const result = await agent.generate(enrichedMessage, {
      resourceId: threadId || "default-thread",
      threadId: threadId || "default-thread",
    });

    res.json({
      success: true,
      text: result.text,
      threadId: threadId || "default-thread",
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process message",
    });
  }
});

// ============================================
// MESSAGE ENDPOINTS (requires auth)
// ============================================

// Get chat history for authenticated user
app.get("/api/messages", verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { query } = await import('../db');

    const result = await query(
      `SELECT id, content, role, agent_name, metadata, created_at
       FROM messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      messages: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve messages",
    });
  }
});

// Send message and get AI response (requires auth)
app.post("/api/messages", verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { message, agent } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a non-empty string"
      });
    }

    const { query } = await import('../db');

    // Store user message
    await query(
      `INSERT INTO messages (user_id, content, role, agent_name)
       VALUES ($1, $2, $3, $4)`,
      [userId, message, 'user', agent || null]
    );

    // Extract agent name from message or use provided agent parameter
    // Support both UI-friendly names (gmail, instagram) and @mention style (@mail)
    let agentName = agent || 'gmail';  // Default to gmail
    let cleanedMessage = message;

    // Detect @mention patterns
    const mentionMatch = message.match(/@(\w+)/);
    if (mentionMatch) {
      const mention = mentionMatch[1];
      agentName = mention === 'mail' ? 'gmail' : mention;  // Map @mail to gmail
      cleanedMessage = message.replace(/@\w+\s*/g, "").trim();
    }

    // Call the dedicated agents API at localhost:5001
    const apiResult = await callAgentsAPI(agentName, cleanedMessage, userId!);
    const responseText = apiResult.text;

    // If agent is gmail/mail, save to memory store for context
    if (agentName === 'gmail' || agentName === 'mail') {
      const memoryStore = createMemoryStore('@mail');
      await memoryStore.saveMessage(userId!, 'user', cleanedMessage);
      await memoryStore.saveMessage(userId!, 'assistant', responseText);
    }

    // Store assistant response
    await query(
      `INSERT INTO messages (user_id, content, role, agent_name)
       VALUES ($1, $2, $3, $4)`,
      [userId, responseText, 'assistant', agentName]
    );

    res.json({
      success: true,
      text: responseText,
      agent: agentName,
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process message",
    });
  }
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
  console.log(`✅ Echo Email API running on port ${PORT}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   Health:    GET  http://localhost:${PORT}/health`);
  console.log(`   Register:  POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   Login:     POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   Logout:    POST http://localhost:${PORT}/api/auth/logout`);
  console.log(`   Messages:  GET  http://localhost:${PORT}/api/messages`);
  console.log(`   Send Msg:  POST http://localhost:${PORT}/api/messages`);
  console.log(`   Chat:      POST http://localhost:${PORT}/api/chat (legacy)`);
  console.log(`\n💡 DEV MODE: Mock Gmail responses enabled (NODE_ENV=development)`);
  console.log(`   No real Gmail OAuth needed for testing!\n`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n📭 Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    console.log("✅ HTTP server closed");
    console.log("👋 Goodbye!\n");
    process.exit(0);
  });

  // Force shutdown after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 5000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;
