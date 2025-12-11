import { Agent, createTool } from "@mastra/core";
import { z } from "zod";
const { getWhatsAppClient, isWhatsAppReady } = require("../config/whatsapp-client");

const WHATSAPP_AGENT_PROMPT = `# Role
You are the WhatsApp Assistant for lifeOS - helping users manage their WhatsApp messages through natural conversation.

# Your Capabilities
You have REAL access to the user's WhatsApp account. You can:
- List recent chats
- Read messages from specific contacts/groups
- Send messages to contacts/groups
- Search for messages
- Get chat information

# Response Style
- Be conversational and helpful
- Show messages clearly with sender name and timestamp
- Organize multiple messages in a readable format
- Use natural language to describe actions

# Message Format
When showing messages, use this format:
**Contact Name** (time)
Message content

# Important
- Always confirm before sending messages
- Show who you're sending to before sending
- Summarize actions taken

Your goal: Make WhatsApp management seamless through conversation.`;

// Helper function to get recent chats
async function getRecentChats(limit: number = 10) {
  const client = getWhatsAppClient();
  if (!client || !isWhatsAppReady()) {
    return { error: "WhatsApp not connected" };
  }

  try {
    const chats = await client.getChats();
    const recentChats = chats.slice(0, limit);

    return {
      chats: recentChats.map((chat: any) => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user,
        lastMessage: chat.lastMessage?.body || "",
        timestamp: chat.lastMessage?.timestamp || 0,
        unreadCount: chat.unreadCount || 0,
        isGroup: chat.isGroup,
      })),
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Helper function to get messages from a chat
async function getChatMessages(chatId: string, limit: number = 20) {
  const client = getWhatsAppClient();
  if (!client || !isWhatsAppReady()) {
    return { error: "WhatsApp not connected" };
  }

  try {
    const chat = await client.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit });

    return {
      messages: messages.map((msg: any) => ({
        id: msg.id._serialized,
        body: msg.body,
        from: msg.from,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp,
        author: msg.author || msg.from,
      })),
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Helper function to send message
async function sendWhatsAppMessage(chatId: string, message: string) {
  const client = getWhatsAppClient();
  if (!client || !isWhatsAppReady()) {
    return { error: "WhatsApp not connected" };
  }

  try {
    await client.sendMessage(chatId, message);
    return { success: true, message: "Message sent successfully" };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Create Mastra tools
const getRecentChatsTool = createTool({
  id: "get_recent_chats",
  description: "Get list of recent WhatsApp chats",
  inputSchema: z.object({
    limit: z.number().optional().describe("Number of chats to retrieve (default 10)"),
  }),
  execute: async ({ context }) => {
    const limit = (context as any).limit || 10;
    return await getRecentChats(limit);
  },
});

const getChatMessagesTool = createTool({
  id: "get_chat_messages",
  description: "Get messages from a specific WhatsApp chat",
  inputSchema: z.object({
    chatId: z.string().describe("The chat ID to get messages from"),
    limit: z.number().optional().describe("Number of messages to retrieve (default 20)"),
  }),
  execute: async ({ context }) => {
    const { chatId, limit } = context as any;
    return await getChatMessages(chatId, limit || 20);
  },
});

const sendMessageTool = createTool({
  id: "send_message",
  description: "Send a WhatsApp message to a chat",
  inputSchema: z.object({
    chatId: z.string().describe("The chat ID to send message to"),
    message: z.string().describe("The message content to send"),
  }),
  execute: async ({ context }) => {
    const { chatId, message } = context as any;
    return await sendWhatsAppMessage(chatId, message);
  },
});

// Simple in-memory conversation store (keyed by userId)
const conversationHistory = new Map();

// Helper to get conversation history
export function getConversationHistory(userId: string) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  return conversationHistory.get(userId);
}

// Helper to add message to history
export function addToConversation(userId: string, role: string, content: string) {
  const history = getConversationHistory(userId);
  history.push({ role, content });

  // Keep only last 10 messages to avoid context overflow
  if (history.length > 10) {
    history.shift();
  }
}

// Export agent creator and helper functions
export async function createWhatsAppAgent() {
  console.log("✅ WhatsApp agent loaded with 3 tools");

  return new Agent({
    name: "whatsapp-agent",
    instructions: WHATSAPP_AGENT_PROMPT + "\n\nNote: WhatsApp integration is initializing. Please scan QR code if prompted.",
    model: "openai/gpt-4o-mini",
    tools: {
      getRecentChats: getRecentChatsTool,
      getChatMessages: getChatMessagesTool,
      sendMessage: sendMessageTool,
    },
  });
}

// Export helper functions for direct use
export { getRecentChats, getChatMessages, sendWhatsAppMessage };
