const { Mastra } = require("@mastra/core");
const { createGmailAgent } = require("../agents/gmail.agent");

// Initialize Gmail agent with MCP tools asynchronously
let gmailAgentInstance: any = null;
let mastraInstance: any = null;

async function initializeMastra() {
  try {
    console.log("🔄 Initializing Gmail agent with MCP tools...");
    gmailAgentInstance = await createGmailAgent();
    console.log("✅ Gmail agent initialized successfully");

    mastraInstance = new Mastra({
      agents: {
        gmailAgent: gmailAgentInstance,
      },
    });

    console.log("✅ Mastra configured with Gmail agent");
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
