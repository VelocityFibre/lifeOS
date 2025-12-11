const { Mastra } = require("@mastra/core");
const { createGmailAgent } = require("../agents/gmail.agent");
const { createClaudeCodeAgent } = require("../agents/claude-code.agent");
const { createWhatsAppAgent } = require("../agents/whatsapp.agent");
const { initializeWhatsAppClient } = require("./whatsapp-client");

// Initialize agents asynchronously
let gmailAgentInstance: any = null;
let claudeCodeAgentInstance: any = null;
let whatsappAgentInstance: any = null;
let mastraInstance: any = null;

async function initializeMastra() {
  try {
    console.log("🔄 Initializing agents...");

    // Initialize Gmail agent with MCP tools
    gmailAgentInstance = await createGmailAgent();
    console.log("✅ Gmail agent initialized");

    // Initialize Claude Code agent
    claudeCodeAgentInstance = await createClaudeCodeAgent();
    console.log("✅ Claude Code agent initialized");

    // Initialize WhatsApp client and agent
    await initializeWhatsAppClient();
    whatsappAgentInstance = await createWhatsAppAgent();
    console.log("✅ WhatsApp agent initialized");

    mastraInstance = new Mastra({
      agents: {
        gmailAgent: gmailAgentInstance,
        claudeCodeAgent: claudeCodeAgentInstance,
        whatsappAgent: whatsappAgentInstance,
      },
    });

    console.log("✅ Mastra configured with all agents");
    return mastraInstance;
  } catch (error) {
    console.error("❌ Error initializing Mastra:", error);
    throw error;
  }
}

// Export the initialization function and getter
exports.initializeMastra = initializeMastra;
exports.getMastra = () => {
  if (!mastraInstance) {
    throw new Error("Mastra not initialized. Call initializeMastra() first.");
  }
  return mastraInstance;
};
