const { MCPClient } = require("@mastra/mcp");

// Create MCP client with Gmail server
exports.gmailMcpClient = new MCPClient({
  id: "gmail-mcp-client",
  servers: {
    gmail: {
      command: "npx",
      args: ["-y", "@gongrzhe/server-gmail-autoauth-mcp"],
    },
  },
});

console.log("✅ Gmail MCP Client configured");
