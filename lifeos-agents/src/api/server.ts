require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { initializeMastra, getMastra } = require("../config/mastra");
const { callClaudeCode } = require("../agents/claude-code.agent");
const { getConversationHistory: getGmailHistory, addToConversation: addToGmailConversation } = require("../agents/gmail.agent");
const { getConversationHistory: getWhatsAppHistory, addToConversation: addToWhatsAppConversation } = require("../agents/whatsapp.agent");

import type { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Store mastra instance
let mastra: any = null;

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "lifeos-agents",
    version: "1.0.0",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// List available agents
app.get("/api/agents", (req: Request, res: Response) => {
  // In Mastra 0.23.1, agents are stored internally.
  // We'll return the list of agent names we registered.
  const agents = ["gmailAgent", "claudeCodeAgent", "whatsappAgent"];
  res.json({
    success: true,
    agents,
    count: agents.length,
  });
});

// Chat with specific agent
app.post("/api/agents/:agentId/chat", async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { message, userId } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a non-empty string",
      });
    }

    // Get the requested agent
    const mastraInstance = getMastra();
    const agent = mastraInstance.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent '${agentId}' not found`,
        availableAgents: ["gmailAgent", "claudeCodeAgent", "whatsappAgent"],
      });
    }

    // Generate response
    let result;

    // Special handling for Claude Code agent - use SDK directly
    if (agentId === 'claudeCodeAgent') {
      const responseText = await callClaudeCode(message, "/home/louisdup/Agents/lifeOS");
      result = { text: responseText };
    } else if (agentId === 'gmailAgent') {
      // Gmail agent with conversation history
      const userIdKey = userId || "anonymous";

      // Get conversation history
      const history = getGmailHistory(userIdKey);

      // Add user message to history
      addToGmailConversation(userIdKey, "user", message);

      // Build context-aware message with conversation history
      let contextMessage = message;
      if (history.length > 1) {
        // Include last few messages as context
        const recentHistory = history.slice(-6); // Last 6 messages (3 exchanges)
        const contextStr = recentHistory
          .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        contextMessage = `Conversation history:\n${contextStr}\n\nCurrent message: ${message}`;
      }

      result = await agent.generate(contextMessage, {
        resourceId: userIdKey,
        threadId: userIdKey,
      });

      // Add agent response to history
      addToGmailConversation(userIdKey, "assistant", result.text);
    } else if (agentId === 'whatsappAgent') {
      // WhatsApp agent with conversation history
      const userIdKey = userId || "anonymous";

      // Get conversation history
      const history = getWhatsAppHistory(userIdKey);

      // Add user message to history
      addToWhatsAppConversation(userIdKey, "user", message);

      // Build context-aware message with conversation history
      let contextMessage = message;
      if (history.length > 1) {
        // Include last few messages as context
        const recentHistory = history.slice(-6); // Last 6 messages (3 exchanges)
        const contextStr = recentHistory
          .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        contextMessage = `Conversation history:\n${contextStr}\n\nCurrent message: ${message}`;
      }

      result = await agent.generate(contextMessage, {
        resourceId: userIdKey,
        threadId: userIdKey,
      });

      // Add agent response to history
      addToWhatsAppConversation(userIdKey, "assistant", result.text);
    } else {
      // Use standard Mastra agent.generate() for other agents
      result = await agent.generate(message, {
        resourceId: userId || "anonymous",
        threadId: userId || "anonymous",
      });
    }

    res.json({
      success: true,
      agent: agentId,
      text: result.text,
      userId: userId || "anonymous",
    });
  } catch (error: any) {
    console.error(`Agent chat error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process message",
    });
  }
});

// Initialize Mastra and start server
async function startServer() {
  try {
    // Initialize Mastra with Gmail MCP
    mastra = await initializeMastra();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✅ lifeOS Agents API running on port ${PORT}\n`);
      console.log(`📋 Endpoints:`);
      console.log(`   Health:  GET  http://localhost:${PORT}/health`);
      console.log(`   Agents:  GET  http://localhost:${PORT}/api/agents`);
      console.log(`   Chat:    POST http://localhost:${PORT}/api/agents/:agentId/chat`);
      console.log(`\n🤖 Available agents:`);
      console.log(`   - gmailAgent: Gmail MCP tools`);
      console.log(`   - claudeCodeAgent: Claude Code SDK (Max plan)`);
      console.log(`   - whatsappAgent: WhatsApp Web integration`);
      console.log();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📭 Received SIGTERM. Starting graceful shutdown...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n📭 Received SIGINT. Starting graceful shutdown...");
  process.exit(0);
});
