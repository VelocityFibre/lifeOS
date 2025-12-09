require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { initializeMastra, getMastra } = require("../config/mastra");

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
  const agents = ["gmailAgent"]; // Hardcoded for now, will be dynamic when we add more
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
        availableAgents: ["gmailAgent"],
      });
    }

    // Generate response
    const result = await agent.generate(message, {
      resourceId: userId || "anonymous",
      threadId: userId || "anonymous",
    });

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
      console.log(`\n🤖 Available agents: gmailAgent (with Gmail MCP tools)`);
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
