import React, { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, Linking, FlatList, TextInput } from "react-native";
import Markdown from "react-native-markdown-display";
import NetInfo from "@react-native-community/netinfo";
import { useChatStore } from "../store/chatStore";

interface AgentChatProps {
  agentId: string;
  agentName: string;
  agentAvatar: string;
  onBack: () => void;
}

export default function AgentChat({ agentId, agentName, agentAvatar, onBack }: AgentChatProps) {
  const { messages, isLoading, isOnline, sendMessage, setOnlineStatus } = useChatStore();
  const [inputText, setInputText] = useState("");

  // Filter messages for this agent
  const agentMessages = messages.filter((msg) => msg.agentId === agentId);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnlineStatus(state.isConnected ?? true);
    });

    NetInfo.fetch().then(state => {
      setOnlineStatus(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, [setOnlineStatus]);

  const onSend = async () => {
    if (inputText.trim()) {
      await sendMessage(inputText);
      setInputText("");
    }
  };

  // Handle link clicks
  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open this URL: ${url}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open link");
      console.error("Error opening link:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.user._id === 1;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAgent]}>
        <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
          {!isUser && item.text ? (
            <Markdown
              style={markdownStyles}
              onLinkPress={handleLinkPress}
            >
              {item.text}
            </Markdown>
          ) : (
            <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAgent]}>
              {item.text}
            </Text>
          )}
          <Text style={[styles.messageTime, isUser ? styles.messageTimeUser : styles.messageTimeAgent]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  // Show welcome message if no messages yet
  const displayMessages = agentMessages.length > 0 ? agentMessages : [
    {
      _id: "welcome",
      text: `👋 Welcome! I'm your ${agentName}.\n\nHow can I help you today?`,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: agentName,
        avatar: agentAvatar,
      },
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.avatarCircle}>
          <Text style={styles.headerAvatar}>{agentAvatar}</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{agentName}</Text>
          <Text style={styles.headerStatus}>online</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerIcon}>⋮</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Offline Indicator */}
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>📡 No Internet Connection</Text>
          </View>
        )}

        {/* Messages */}
        <View style={styles.messagesBackground}>
          <FlatList
            data={[...displayMessages].reverse()}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            inverted
            contentContainerStyle={styles.messagesList}
          />
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Message ${agentName}...`}
            placeholderTextColor="#8696A0"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
            onPress={onSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111B21",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 12,
    paddingBottom: 12,
    backgroundColor: "#202C33",
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 24,
    color: "#AEBAC1",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#182229",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerAvatar: {
    fontSize: 20,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#E9EDEF",
  },
  headerStatus: {
    fontSize: 12,
    color: "#8696A0",
  },
  headerRight: {
    marginLeft: 8,
  },
  headerIcon: {
    fontSize: 24,
    color: "#AEBAC1",
  },
  chatContainer: {
    flex: 1,
  },
  messagesBackground: {
    flex: 1,
    backgroundColor: "#0B141A",
  },
  messagesList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  messageRow: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  messageRowAgent: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 8,
    padding: 8,
    paddingBottom: 4,
  },
  bubbleUser: {
    backgroundColor: "#005C4B",
    borderTopRightRadius: 0,
  },
  bubbleAgent: {
    backgroundColor: "#202C33",
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextUser: {
    color: "#E9EDEF",
  },
  messageTextAgent: {
    color: "#E9EDEF",
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  messageTimeUser: {
    color: "#99CDB8",
  },
  messageTimeAgent: {
    color: "#8696A0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#202C33",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#2A3942",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#E9EDEF",
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A3942",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#00A884",
  },
  sendIcon: {
    fontSize: 20,
    color: "#E9EDEF",
  },
  offlineIndicator: {
    backgroundColor: "#FF3B30",
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

// Markdown styles for agent messages
const markdownStyles = {
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#E9EDEF",
    marginBottom: 4,
  },
  strong: {
    fontWeight: "700",
    color: "#E9EDEF",
  },
  em: {
    fontStyle: "italic",
    color: "#E9EDEF",
  },
  link: {
    color: "#53BDEB",
    textDecorationLine: "underline",
  },
  list_item: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: 2,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  code_inline: {
    backgroundColor: "#182229",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    color: "#E9EDEF",
  },
  fence: {
    backgroundColor: "#182229",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    color: "#E9EDEF",
  },
  heading1: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 8,
    color: "#E9EDEF",
  },
  heading2: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 6,
    color: "#E9EDEF",
  },
  heading3: {
    fontSize: 15,
    fontWeight: "600",
    marginVertical: 4,
    color: "#E9EDEF",
  },
};
