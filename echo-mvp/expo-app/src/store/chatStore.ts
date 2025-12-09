import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendMessageToAgent, sendAuthenticatedMessage, getMessages, sendMessageToSpecificAgent } from "../api/mastra";

interface Message {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
    avatar?: string;
  };
  agentId?: string; // Track which agent this message belongs to
}

interface User {
  id: string;
  email: string;
  username?: string;
}

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  isOnline: boolean;
  accessToken: string | null; // Legacy OAuth token (deprecated)
  jwtToken: string | null; // New JWT token
  user: User | null; // Current user info
  threadId: string;
  currentAgentId: string | null; // Currently selected agent

  setAccessToken: (token: string) => void;
  setJwtToken: (token: string, user: User) => void;
  clearAuth: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setCurrentAgent: (agentId: string) => void;
  sendMessage: (text: string) => Promise<void>;
  loadMessageHistory: (agentId?: string) => Promise<void>;
  getMessagesByAgent: (agentId: string) => Message[];
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      isOnline: true, // Default to online
      accessToken: null, // Legacy
      jwtToken: null,
      user: null,
      threadId: "default-thread",
      currentAgentId: null,

      setAccessToken: (token: string) => {
        set({ accessToken: token });
      },

      setJwtToken: (token: string, user: User) => {
        set({ jwtToken: token, user });
      },

      clearAuth: () => {
        set({ jwtToken: null, user: null, accessToken: null });
      },

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
      },

      setCurrentAgent: (agentId: string) => {
        set({ currentAgentId: agentId });
      },

      getMessagesByAgent: (agentId: string) => {
        const { messages } = get();
        return messages.filter((msg) => msg.agentId === agentId);
      },

      loadMessageHistory: async (agentId?: string) => {
        const { jwtToken } = get();

        if (!jwtToken) {
          console.log("No JWT token - skipping message history load");
          return;
        }

        try {
          const response = await getMessages(jwtToken, 50, 0);

          // Convert backend messages to chat messages
          const loadedMessages: Message[] = response.messages.reverse().map((msg, index) => {
            // Extract agent from metadata or agent_name field
            const msgAgentId = msg.agent_name || msg.metadata?.agent || 'mail';

            return {
              _id: msg.id || `loaded-${index}`,
              text: msg.content,
              createdAt: new Date(msg.created_at),
              agentId: msgAgentId,
              user: msg.role === 'user'
                ? { _id: 1, name: "You" }
                : {
                    _id: 2,
                    name: msg.agent_name || "Assistant",
                    avatar: msgAgentId === 'mail' ? "📧" :
                            msgAgentId === 'instagram' ? "📸" :
                            msgAgentId === 'cal' ? "📅" :
                            msgAgentId === 'mem' ? "🧠" :
                            msgAgentId === 'task' ? "✅" :
                            msgAgentId === 'finance' ? "💰" :
                            msgAgentId === 'health' ? "❤️" :
                            msgAgentId === 'spotify' ? "🎵" :
                            msgAgentId === 'google-photos' ? "📷" :
                            msgAgentId === 'google-drive' ? "📁" : "🤖"
                  },
            };
          });

          // Replace messages with loaded history
          set({ messages: loadedMessages });
        } catch (error: any) {
          console.error("Failed to load message history:", error.message);
          // Don't show error to user - just continue with local messages
        }
      },

      sendMessage: async (text: string) => {
        const { jwtToken, accessToken, threadId, isOnline, currentAgentId, user } = get();

        // Check if offline
        if (!isOnline) {
          set((state) => ({
            messages: [
              {
                _id: Date.now().toString(),
                text: "📡 You're offline. Please check your internet connection and try again.",
                createdAt: new Date(),
                user: { _id: 2, name: "System" },
                agentId: currentAgentId || undefined,
              },
              ...state.messages,
            ],
          }));
          return;
        }

        // Prefer JWT auth over legacy OAuth
        if (!jwtToken && !accessToken) {
          set((state) => ({
            messages: [
              {
                _id: Date.now().toString(),
                text: "⚠️ Please log in to continue. Tap Settings to sign in or create an account.",
                createdAt: new Date(),
                user: { _id: 2, name: "System" },
                agentId: currentAgentId || undefined,
              },
              ...state.messages,
            ],
          }));
          return;
        }

        // Add user message
        const userMessage: Message = {
          _id: Date.now().toString(),
          text,
          createdAt: new Date(),
          user: { _id: 1, name: "You" },
          agentId: currentAgentId || undefined,
        };

        set((state) => ({
          messages: [userMessage, ...state.messages],
          isLoading: true,
        }));

        try {
          let response;

          // Check if this is a Gmail agent request (uses separate agents service)
          if (currentAgentId === 'mail') {
            // Use Gmail agent from agents service
            // Remove @mail mention from the text
            const cleanedText = text.replace(/@mail\s*/g, '').trim();
            const gmailResponse = await sendMessageToSpecificAgent(
              'gmailAgent',
              cleanedText,
              user?.email || user?.id || 'anonymous'
            );
            response = {
              success: gmailResponse.success,
              text: gmailResponse.text,
              agent: 'Gmail',
              threadId: undefined,
            };
          } else if (jwtToken) {
            // Use JWT auth for other agents (preferred)
            response = await sendAuthenticatedMessage(text, jwtToken, currentAgentId || undefined);
          } else {
            // Fallback to legacy OAuth flow
            response = await sendMessageToAgent({
              message: text,
              accessToken: accessToken!,
              threadId,
            });
          }

          // Determine agent ID from response or use current
          // Map 'gmailAgent' back to 'mail' for UI consistency
          let responseAgentId = response.agent?.replace('@', '') || currentAgentId || 'mail';
          if (responseAgentId === 'gmailAgent' || responseAgentId === 'Gmail') {
            responseAgentId = 'mail';
          }

          // Add agent response
          const agentMessage: Message = {
            _id: (Date.now() + 1).toString(),
            text: response.text,
            createdAt: new Date(),
            agentId: responseAgentId,
            user: {
              _id: 2,
              name: response.agent || "Assistant",
              avatar: responseAgentId === 'mail' ? "📧" :
                      responseAgentId === 'instagram' ? "📸" :
                      responseAgentId === 'cal' ? "📅" :
                      responseAgentId === 'mem' ? "🧠" :
                      responseAgentId === 'task' ? "✅" :
                      responseAgentId === 'finance' ? "💰" :
                      responseAgentId === 'health' ? "❤️" :
                      responseAgentId === 'spotify' ? "🎵" :
                      responseAgentId === 'google-photos' ? "📷" :
                      responseAgentId === 'google-drive' ? "📁" : "🤖",
            },
          };

          set((state) => ({
            messages: [agentMessage, ...state.messages],
            isLoading: false,
            threadId: response.threadId || threadId,
          }));
        } catch (error: any) {
          // Determine error message
          let errorText = `❌ Error: ${error.message}`;

          // Check if it's a network error
          if (error.message.includes('fetch') ||
              error.message.includes('network') ||
              error.message.includes('Failed to connect')) {
            errorText = "📡 Network error. Please check your internet connection.";
            set({ isOnline: false }); // Update online status
          }

          // Check if it's an auth error
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorText = "🔒 Session expired. Please log in again.";
            set({ jwtToken: null, user: null }); // Clear auth
          }

          // Add error message
          const errorMessage: Message = {
            _id: (Date.now() + 1).toString(),
            text: errorText,
            createdAt: new Date(),
            user: { _id: 2, name: "System" },
            agentId: currentAgentId || undefined,
          };

          set((state) => ({
            messages: [errorMessage, ...state.messages],
            isLoading: false,
          }));
        }
      },

      clearMessages: () => {
        set({ messages: [], threadId: `thread-${Date.now()}` });
      },
    }),
    {
      name: "chat-storage", // unique name for AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      // Persist JWT token, user, and messages
      partialize: (state) => ({
        messages: state.messages,
        jwtToken: state.jwtToken,
        user: state.user,
        accessToken: state.accessToken, // Keep for backward compatibility
        threadId: state.threadId,
        currentAgentId: state.currentAgentId,
      }),
      // Custom merge function to handle Date deserialization
      merge: (persistedState: any, currentState: ChatStore) => {
        const restored = persistedState as Partial<ChatStore>;
        return {
          ...currentState,
          ...restored,
          messages: (restored.messages || []).map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          })),
        };
      },
    }
  )
);
