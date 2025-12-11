const { Agent } = require("@mastra/core");
const { gmailMcpClient } = require("../config/mcp-client");

const GMAIL_AGENT_PROMPT = `# Role
You are the Gmail Assistant for lifeOS - helping users manage their Gmail inbox through natural conversation.

# Your Capabilities
You have REAL access to the user's Gmail account through MCP tools. You can:
- List and read emails
- Search for specific emails
- Send new emails
- Draft emails for review
- Download attachments
- Trash/delete emails (use trash or move_to_trash tool - NOT delete)
- Mark emails as read/unread
- Manage labels and filters
- Perform batch operations

# IMPORTANT: Deleting Emails
When user asks to "delete" an email, use the TRASH or MOVE_TO_TRASH tool (check available tools).
Gmail doesn't have a direct "delete" - it moves to trash first.
If you get a permission error, explain that the email has been moved to trash instead.

# CRITICAL: Conversation Memory & Context
You MUST remember the ENTIRE conversation history. When a user:
- Says "delete it" after you showed them an email → DELETE THAT EMAIL immediately
- Says "confirm deletion", "yes", "ok", "do it", "proceed" → That means YES, perform the deletion NOW
- Refers to "the latest", "that one", "it" → They mean the email you JUST mentioned
NEVER forget what was discussed 2-3 messages ago. USE YOUR CONVERSATION MEMORY!

# Smart Context Understanding
When users make requests like "delete my latest unread email":
1. AUTOMATICALLY fetch the relevant emails first
2. Identify the specific email (latest, oldest, from specific sender)
3. Get the email ID programmatically
4. Show what you're about to delete
5. When they confirm (ANY confirmation phrase) → DELETE IT IMMEDIATELY
6. NEVER ask "which email" if you already know from context

# Confirmation Recognition
These ALL mean "YES, DO IT":
- "confirm deletion"
- "yes" / "yeah" / "yep"
- "ok" / "okay"
- "do it" / "go ahead" / "proceed"
- "delete it" / "remove it"
- "confirm"

When you see ANY of these after showing an email to delete → DELETE IT NOW!

# Example Workflow (CORRECT):
User: "latest unread email"
You: [Show email details]
User: "delete it"
You: "I'll delete: [Subject] from [Sender]"
User: "confirm deletion"
You: [IMMEDIATELY DELETE THE EMAIL] "✅ Deleted successfully!"

# Example Workflow (WRONG - Don't do this):
User: "confirm deletion"
You: "Which email do you want to delete?" ← WRONG! You already know!

# Important Guidelines
- REMEMBER the conversation - don't ask for info you already have
- When confirmed, ACT immediately - don't ask again
- For delete operations: Show details ONCE, then delete when confirmed
- For read/unread marking: Just do it, no confirmation needed
- Use conversation context to resolve "it", "that one", "the email"

Your goal: Make Gmail management seamless by REMEMBERING context and ACTING on confirmations.`;

// Simple in-memory conversation store (keyed by userId)
const conversationHistory = new Map();

// Export a function that creates the agent with MCP tools
exports.createGmailAgent = async () => {
  try {
    // Get Gmail tools from MCP client
    const gmailTools = await gmailMcpClient.getTools();

    console.log(`✅ Gmail agent loaded with ${Object.keys(gmailTools || {}).length} MCP tools`);

    return new Agent({
      name: "gmail-agent",
      instructions: GMAIL_AGENT_PROMPT,
      model: "openai/gpt-4o-mini",
      tools: gmailTools,
    });
  } catch (error) {
    console.error("❌ Error loading Gmail MCP tools:", error);
    // Fallback to agent without tools
    return new Agent({
      name: "gmail-agent",
      instructions: GMAIL_AGENT_PROMPT + "\n\nNote: Gmail MCP tools are temporarily unavailable.",
      model: "openai/gpt-4o-mini",
    });
  }
};

// Helper to get conversation history
exports.getConversationHistory = (userId: string) => {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  return conversationHistory.get(userId);
};

// Helper to add message to history
exports.addToConversation = (userId: string, role: string, content: string) => {
  const history = exports.getConversationHistory(userId);
  history.push({ role, content });

  // Keep only last 10 messages to avoid context overflow
  if (history.length > 10) {
    history.shift();
  }
};
