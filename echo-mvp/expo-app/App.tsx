import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import ContactList, { AGENT_CONTACTS } from "./src/screens/ContactList";
import AgentChat from "./src/screens/AgentChat";
import AuthScreen from "./src/screens/AuthScreen";
import { useChatStore } from "./src/store/chatStore";
import { checkHealth } from "./src/api/mastra";

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { jwtToken, user, clearAuth, loadMessageHistory, setCurrentAgent } = useChatStore();

  useEffect(() => {
    checkBackend();
  }, []);

  useEffect(() => {
    // Load message history when user logs in
    if (jwtToken) {
      loadMessageHistory().catch((error) => {
        console.error("Failed to load message history:", error);
      });
    }
  }, [jwtToken]);

  const checkBackend = async () => {
    const isHealthy = await checkHealth();
    setBackendConnected(isHealthy);
  };

  const handleLogout = () => {
    clearAuth();
    setSelectedAgentId(null);
  };

  const handleSelectContact = (agentId: string) => {
    setCurrentAgent(agentId);
    setSelectedAgentId(agentId);
  };

  const handleBackToContacts = () => {
    setSelectedAgentId(null);
    setCurrentAgent(null);
  };

  // Show auth screen if not logged in
  if (!jwtToken) {
    return <AuthScreen onClose={() => {}} backendConnected={backendConnected} />;
  }

  // Show auth screen if user clicks settings
  if (showAuth) {
    return <AuthScreen onClose={() => setShowAuth(false)} backendConnected={backendConnected} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Split screen: Sidebar + Chat */}
      <View style={styles.splitContainer}>
        {/* Left Sidebar - Contact List */}
        <View style={styles.sidebar}>
          <ContactList
            onSelectContact={handleSelectContact}
            selectedAgentId={selectedAgentId}
          />
        </View>

        {/* Right Panel - Chat or Placeholder */}
        <View style={styles.chatPanel}>
          {selectedAgentId ? (
            (() => {
              const agent = AGENT_CONTACTS.find((a) => a.id === selectedAgentId);
              return agent ? (
                <AgentChat
                  agentId={agent.id}
                  agentName={agent.name}
                  agentAvatar={agent.avatar}
                  onBack={handleBackToContacts}
                />
              ) : null;
            })()
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>💬</Text>
              <Text style={styles.placeholderTitle}>lifeOS</Text>
              <Text style={styles.placeholderText}>
                Your AI-powered personal assistant ecosystem. Select an agent to start.
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: backendConnected ? "#00A884" : "#f44336" }]} />
                <Text style={styles.statusText}>
                  {backendConnected ? "Connected" : "Disconnected"}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111B21",
  },
  splitContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: Platform.OS === "web" ? 400 : "100%",
    borderRightWidth: Platform.OS === "web" ? 1 : 0,
    borderRightColor: "#2A3942",
    display: Platform.OS === "web" ? "flex" : "flex",
  },
  chatPanel: {
    flex: 1,
    display: Platform.OS === "web" ? "flex" : "none",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#222E35",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    fontSize: 120,
    marginBottom: 24,
    opacity: 0.3,
  },
  placeholderTitle: {
    fontSize: 32,
    fontWeight: "300",
    color: "#E9EDEF",
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: "#8696A0",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A3942",
    marginTop: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    color: "#8696A0",
  },
});
