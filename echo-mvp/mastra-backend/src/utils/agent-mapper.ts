/**
 * Agent Name Mapper
 * Maps simple UI-friendly agent names to actual Mastra agent IDs
 * and provides utilities for calling the dedicated agents API
 */

// Map UI names (from frontend ContactList) to Mastra agent IDs
export const AGENT_NAME_MAP: Record<string, string> = {
  // Current agents
  'gmail': 'gmailAgent',
  'mail': 'gmailAgent',  // Support both "mail" and "gmail"

  // Future agents (when implemented)
  'instagram': 'instagramAgent',
  'spotify': 'spotifyAgent',
  'cal': 'calendarAgent',        // Calendar
  'calendar': 'calendarAgent',
  'mem': 'memoryAgent',          // Memory
  'memory': 'memoryAgent',
  'task': 'tasksAgent',          // Tasks
  'tasks': 'tasksAgent',
  'finance': 'financeAgent',
  'health': 'healthAgent',
  'google-photos': 'googlePhotosAgent',
  'google-drive': 'googleDriveAgent',
};

// Reverse map for displaying user-friendly names
export const AGENT_ID_TO_NAME: Record<string, string> = Object.entries(AGENT_NAME_MAP)
  .reduce((acc, [name, id]) => {
    if (!acc[id]) acc[id] = name;
    return acc;
  }, {} as Record<string, string>);

/**
 * Get Mastra agent ID from UI-friendly name
 */
export function getAgentId(uiName: string): string | null {
  return AGENT_NAME_MAP[uiName.toLowerCase()] || null;
}

/**
 * Get UI-friendly name from Mastra agent ID
 */
export function getAgentName(agentId: string): string {
  return AGENT_ID_TO_NAME[agentId] || agentId;
}

/**
 * Check if an agent is implemented (exists in agents API)
 */
export function isAgentImplemented(uiName: string): boolean {
  const agentId = getAgentId(uiName);
  // For now, only gmailAgent is implemented
  return agentId === 'gmailAgent';
}

/**
 * Call the dedicated agents API at localhost:5001
 */
export async function callAgentsAPI(
  uiAgentName: string,
  message: string,
  userId: string
): Promise<{ success: boolean; text: string; agent?: string; error?: string }> {
  const agentId = getAgentId(uiAgentName);

  if (!agentId) {
    return {
      success: false,
      text: `Unknown agent: ${uiAgentName}`,
      error: `Agent '${uiAgentName}' not found`,
    };
  }

  if (!isAgentImplemented(uiAgentName)) {
    return {
      success: true,
      text: getComingSoonMessage(uiAgentName),
      agent: uiAgentName,
    };
  }

  try {
    const AGENTS_API_URL = process.env.AGENTS_API_URL || 'http://localhost:5001';
    const response = await fetch(`${AGENTS_API_URL}/api/agents/${agentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Agents API returned ${response.status}`);
    }

    const data: any = await response.json();
    return {
      success: data.success,
      text: data.text,
      agent: uiAgentName,
    };
  } catch (error: any) {
    console.error(`Error calling agents API for ${agentId}:`, error);
    return {
      success: false,
      text: `Failed to connect to ${uiAgentName} agent. Please try again.`,
      error: error.message,
    };
  }
}

/**
 * Get "coming soon" message for unimplemented agents
 */
function getComingSoonMessage(agentName: string): string {
  const messages: Record<string, string> = {
    instagram: "📸 The Instagram agent is coming soon! I'll be able to help you manage posts, stories, and DMs.",
    spotify: "🎵 The Spotify agent is coming soon! I'll be able to control playback, manage playlists, and discover music.",
    'google-photos': "📷 The Google Photos agent is coming soon! I'll be able to organize photos, create albums, and search memories.",
    'google-drive': "📁 The Google Drive agent is coming soon! I'll be able to manage files, create docs, and share content.",
    cal: "📅 The Calendar agent is coming soon! I'll be able to schedule events, manage meetings, and set reminders.",
    calendar: "📅 The Calendar agent is coming soon! I'll be able to schedule events, manage meetings, and set reminders.",
    mem: "🧠 The Memory agent is coming soon! I'll be able to remember important information and recall past conversations.",
    memory: "🧠 The Memory agent is coming soon! I'll be able to remember important information and recall past conversations.",
    task: "✅ The Tasks agent is coming soon! I'll be able to manage your to-do lists and track progress.",
    tasks: "✅ The Tasks agent is coming soon! I'll be able to manage your to-do lists and track progress.",
    finance: "💰 The Finance agent is coming soon! I'll be able to track expenses, analyze spending, and manage budgets.",
    health: "❤️ The Health agent is coming soon! I'll be able to track workouts, monitor health metrics, and provide wellness tips.",
  };

  return messages[agentName] || `The ${agentName} agent is coming soon!`;
}
