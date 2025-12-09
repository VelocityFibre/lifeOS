/**
 * PostgreSQL Memory Store for Mastra Agents
 *
 * Implements a custom memory storage backend using Neon PostgreSQL
 * instead of LibSQL/SQLite for the hosted architecture.
 *
 * This allows agent memory to be centralized in the cloud database,
 * enabling multi-device access and eliminating local storage.
 */

import { query } from './index';

export interface MemoryMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface MemoryContext {
  userId: string;
  agentName: string;
  threadId?: string;
}

/**
 * PostgreSQL-based Memory Store for Mastra Agents
 *
 * Stores agent conversation history and context in the database
 * using the `agent_state` table.
 */
export class PgMemoryStore {
  private agentName: string;

  constructor(agentName: string) {
    this.agentName = agentName;
  }

  /**
   * Save a message to agent memory
   */
  async saveMessage(
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get current state
      const currentState = await this.getState(userId);
      const messages = currentState?.messages || [];

      // Add new message
      const newMessage: MemoryMessage = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        role,
        content,
        createdAt: new Date(),
        metadata,
      };

      messages.push(newMessage);

      // Keep only last 20 messages (configurable)
      const trimmedMessages = messages.slice(-20);

      // Update state
      await this.setState(userId, {
        ...currentState,
        messages: trimmedMessages,
        lastActivity: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error saving message to ${this.agentName} memory:`, error);
      throw error;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getMessages(
    userId: string,
    limit: number = 20
  ): Promise<MemoryMessage[]> {
    try {
      const state = await this.getState(userId);
      const messages = state?.messages || [];
      return messages.slice(-limit);
    } catch (error) {
      console.error(`Error getting messages from ${this.agentName} memory:`, error);
      return [];
    }
  }

  /**
   * Get agent state for a user
   */
  async getState(userId: string): Promise<Record<string, any> | null> {
    try {
      const result = await query(
        `SELECT state_data FROM agent_state
         WHERE user_id = $1 AND agent_name = $2`,
        [userId, this.agentName]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].state_data;
    } catch (error) {
      console.error(`Error getting state for ${this.agentName}:`, error);
      return null;
    }
  }

  /**
   * Set agent state for a user
   */
  async setState(userId: string, state: Record<string, any>): Promise<void> {
    try {
      await query(
        `INSERT INTO agent_state (user_id, agent_name, state_data)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, agent_name)
         DO UPDATE SET state_data = $3, updated_at = NOW()`,
        [userId, this.agentName, JSON.stringify(state)]
      );
    } catch (error) {
      console.error(`Error setting state for ${this.agentName}:`, error);
      throw error;
    }
  }

  /**
   * Clear all memory for a user
   */
  async clearMemory(userId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM agent_state
         WHERE user_id = $1 AND agent_name = $2`,
        [userId, this.agentName]
      );
    } catch (error) {
      console.error(`Error clearing memory for ${this.agentName}:`, error);
      throw error;
    }
  }

  /**
   * Get working memory (recent context summary)
   */
  async getWorkingMemory(userId: string): Promise<string> {
    try {
      const messages = await this.getMessages(userId, 5);

      if (messages.length === 0) {
        return "No recent conversation history.";
      }

      const context = messages.map(msg => {
        const time = new Date(msg.createdAt).toLocaleTimeString();
        return `[${time}] ${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`;
      }).join('\n');

      return `# Recent Conversation\n${context}`;
    } catch (error) {
      console.error(`Error getting working memory for ${this.agentName}:`, error);
      return "Error loading conversation history.";
    }
  }
}

/**
 * Create a memory store for a specific agent
 */
export function createMemoryStore(agentName: string): PgMemoryStore {
  return new PgMemoryStore(agentName);
}
