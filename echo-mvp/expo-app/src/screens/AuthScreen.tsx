import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { login, register } from "../api/auth";
import { useChatStore } from "../store/chatStore";

interface AuthScreenProps {
  onClose: () => void;
  backendConnected: boolean;
}

export default function AuthScreen({ onClose, backendConnected }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const { setJwtToken, loadMessageHistory } = useChatStore();

  const handleSubmit = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (!backendConnected) {
      Alert.alert("Backend Offline", "Please start the backend server first:\nnpm run api");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (isLogin) {
        response = await login({ email: email.trim(), password });
      } else {
        response = await register({
          email: email.trim(),
          password,
          username: username.trim() || undefined,
        });
      }

      // Store JWT token and user info
      setJwtToken(response.token, response.user);

      // Load message history from server
      await loadMessageHistory();

      Alert.alert(
        "Success",
        isLogin ? "Logged in successfully!" : "Account created successfully!",
        [{ text: "OK", onPress: onClose }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setUsername("");
    setPassword("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            {isLogin ? "Welcome Back! 👋" : "Create Account 🚀"}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? "Sign in to access your conversations"
              : "Join Echo to get started"}
          </Text>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: backendConnected ? "#4CAF50" : "#f44336" },
              ]}
            />
            <Text style={styles.statusText}>
              Backend: {backendConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Username (optional)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={toggleMode} disabled={loading}>
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  switchButtonText: {
    color: "#007AFF",
    fontSize: 14,
  },
  cancelButton: {
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
  },
});
