import React, { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, FlatList, Linking } from "react-native";
import { GiftedChat, IMessage, Send, InputToolbar, Composer, MessageText } from "react-native-gifted-chat";
import Markdown from "react-native-markdown-display";
import NetInfo from "@react-native-community/netinfo";
import { useChatStore } from "../store/chatStore";

// Available agents for @mention
const AGENTS = [
  { id: "mail", name: "@mail", description: "Email management agent" },
  { id: "cal", name: "@cal", description: "Calendar agent (coming soon)" },
  { id: "mem", name: "@mem", description: "Memory agent (coming soon)" },
];

export default function EmailChatScreen() {
  const { messages, isLoading, isOnline, sendMessage, setOnlineStatus } = useChatStore();
  const [inputText, setInputText] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // Monitor network status
  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnlineStatus(state.isConnected ?? true);
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      setOnlineStatus(state.isConnected ?? true);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [setOnlineStatus]);

  // Handle text input changes
  const handleInputTextChanged = (text: string) => {
    setInputText(text);

    // Check if user is typing an @mention
    const lastAtIndex = text.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      // Only show suggestions if @ is at start or after a space, and query is short
      const beforeAt = text.slice(0, lastAtIndex);
      if (beforeAt === "" || beforeAt.endsWith(" ")) {
        const words = textAfterAt.split(/\s/);
        if (words.length === 1) {
          setMentionQuery(textAfterAt.toLowerCase());
          setShowMentionSuggestions(true);
          return;
        }
      }
    }
    setShowMentionSuggestions(false);
  };

  // Handle mention selection
  const selectMention = (agentName: string) => {
    const lastAtIndex = inputText.lastIndexOf("@");
    const beforeMention = inputText.slice(0, lastAtIndex);
    setInputText(beforeMention + agentName + " ");
    setShowMentionSuggestions(false);
  };

  // Filter agents based on query
  const filteredAgents = AGENTS.filter((agent) =>
    agent.name.toLowerCase().includes("@" + mentionQuery)
  );

  const onSend = async (newMessages: IMessage[]) => {
    const text = newMessages[0].text || inputText;
    if (text.trim()) {
      await sendMessage(text);
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

  // Custom message renderer to support markdown
  const renderMessageText = (props: any) => {
    const { currentMessage } = props;
    if (!currentMessage || !currentMessage.text) return null;

    // Only render markdown for agent messages (user._id = 2)
    if (currentMessage.user._id === 2) {
      return (
        <View style={styles.markdownContainer}>
          <Markdown
            style={markdownStyles}
            onLinkPress={handleLinkPress}
          >
            {currentMessage.text}
          </Markdown>
        </View>
      );
    }

    // Default rendering for user messages
    return <MessageText {...props} />;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📡 No Internet Connection</Text>
        </View>
      )}

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: 1,
        }}
        text={inputText}
        onInputTextChanged={handleInputTextChanged}
        placeholder="Ask about your emails... (try typing @)"
        alwaysShowSend
        renderUsernameOnMessage
        renderAvatarOnTop
        showUserAvatar
        isTyping={isLoading}
        renderMessageText={renderMessageText}
        renderInputToolbar={(props) => (
          <View>
            {showMentionSuggestions && filteredAgents.length > 0 && (
              <View style={styles.mentionContainer}>
                <FlatList
                  data={filteredAgents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.mentionItem}
                      onPress={() => selectMention(item.name)}
                    >
                      <Text style={styles.mentionName}>{item.name}</Text>
                      <Text style={styles.mentionDescription}>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            <InputToolbar
              {...props}
              containerStyle={styles.inputToolbar}
              primaryStyle={styles.inputPrimary}
            />
          </View>
        )}
        renderSend={(props) => (
          <Send {...props} containerStyle={styles.sendContainer}>
            <View style={styles.sendButton}>
              <View style={styles.sendIcon} />
            </View>
          </Send>
        )}
        textInputStyle={styles.textInput}
        messagesContainerStyle={styles.messagesContainer}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messagesContainer: {
    backgroundColor: "#f5f5f5",
  },
  inputToolbar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingVertical: 8,
  },
  inputPrimary: {
    alignItems: "center",
  },
  textInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginLeft: 12,
    marginRight: 8,
  },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 5,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#fff",
    transform: [{ rotate: "90deg" }],
    marginLeft: 2,
  },
  mentionContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    maxHeight: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mentionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  mentionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 2,
  },
  mentionDescription: {
    fontSize: 13,
    color: "#666",
  },
  markdownContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  offlineIndicator: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

// Markdown styles for agent messages
const markdownStyles = {
  body: {
    fontSize: 15,
    lineHeight: 20,
  },
  strong: {
    fontWeight: "700",
  },
  em: {
    fontStyle: "italic",
  },
  link: {
    color: "#007AFF",
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
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 14,
  },
  fence: {
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
  },
  heading1: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 6,
  },
  heading3: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 4,
  },
};
