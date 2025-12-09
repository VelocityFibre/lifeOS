import axios from "axios";

// API URL configuration
const API_URL = __DEV__
  ? "http://localhost:3001" // Development (local)
  : "http://72.60.17.245:3009"; // Production (VPS - using IP until DNS is set up)

// Agents API URL (Gmail agent, etc.)
// Using VPS for both dev and prod since Gmail OAuth is configured there
const AGENTS_API_URL = "http://72.60.17.245:5001"; // Always use VPS agents service

export interface ChatMessage {
  message: string;
  accessToken?: string; // Optional for backward compatibility
  threadId?: string;
}

export interface ChatResponse {
  success: boolean;
  text: string;
  threadId?: string;
  agent?: string;
  error?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  messages: Array<{
    id: string;
    content: string;
    role: string;
    agent_name?: string;
    metadata?: any;
    created_at: string;
  }>;
  count: number;
}

/**
 * Send message using new authenticated endpoint (requires JWT)
 */
export async function sendAuthenticatedMessage(
  message: string,
  jwtToken: string,
  agent?: string
): Promise<ChatResponse> {
  try {
    const response = await axios.post(
      `${API_URL}/api/messages`,
      { message, agent },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || "Failed to send message");
    } else if (error.request) {
      throw new Error("No response from server. Is the backend running?");
    } else {
      throw new Error(error.message || "Unknown error occurred");
    }
  }
}

/**
 * Get chat history (requires JWT)
 */
export async function getMessages(
  jwtToken: string,
  limit: number = 50,
  offset: number = 0
): Promise<GetMessagesResponse> {
  try {
    const response = await axios.get(`${API_URL}/api/messages`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      params: { limit, offset },
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || "Failed to get messages");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message || "Unknown error occurred");
    }
  }
}

/**
 * Legacy endpoint for backward compatibility
 * @deprecated Use sendAuthenticatedMessage instead
 */
export async function sendMessageToAgent(params: ChatMessage): Promise<ChatResponse> {
  try {
    const response = await axios.post(`${API_URL}/api/chat`, params, {
      timeout: 30000, // 30 second timeout
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || "Agent request failed");
    } else if (error.request) {
      throw new Error("No response from server. Is the backend running?");
    } else {
      throw new Error(error.message || "Unknown error occurred");
    }
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    return response.data.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Agent API Types
 */
export interface AgentChatRequest {
  message: string;
  userId: string;
}

export interface AgentChatResponse {
  success: boolean;
  agent: string;
  text: string;
  error?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions?: string;
}

/**
 * Send message to a specific agent (Gmail, Calendar, etc.)
 */
export async function sendMessageToSpecificAgent(
  agentId: string,
  message: string,
  userId: string
): Promise<AgentChatResponse> {
  try {
    const response = await axios.post(
      `${AGENTS_API_URL}/api/agents/${agentId}/chat`,
      { message, userId },
      { timeout: 30000 }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || `Agent ${agentId} request failed`);
    } else if (error.request) {
      throw new Error("No response from agents service");
    } else {
      throw new Error(error.message || "Unknown error occurred");
    }
  }
}

/**
 * Get list of available agents
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const response = await axios.get(`${AGENTS_API_URL}/api/agents`, {
      timeout: 5000,
    });
    return response.data.agents || [];
  } catch (error: any) {
    console.error("Failed to get agents:", error);
    return [];
  }
}

/**
 * Check if agents service is healthy
 */
export async function checkAgentsHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${AGENTS_API_URL}/api/agents`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
