import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from "react-native";

// Define agent contacts
export const AGENT_CONTACTS = [
  {
    id: "mail",
    name: "Gmail",
    avatar: "📧",
    description: "Email management & organization",
    lastMessage: "How can I help with your emails?",
    time: "10:00",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "instagram",
    name: "Instagram",
    avatar: "📸",
    description: "Social media management",
    lastMessage: "Coming soon...",
    time: "09:58",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "cal",
    name: "Calendar",
    avatar: "📅",
    description: "Schedule & event management",
    lastMessage: "Coming soon...",
    time: "09:56",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "mem",
    name: "Memory",
    avatar: "🧠",
    description: "Personal knowledge & notes",
    lastMessage: "Coming soon...",
    time: "09:53",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "task",
    name: "Tasks",
    avatar: "✅",
    description: "To-do lists & reminders",
    lastMessage: "Coming soon...",
    time: "09:39",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "finance",
    name: "Finance",
    avatar: "💰",
    description: "Budget tracking & expenses",
    lastMessage: "Coming soon...",
    time: "09:35",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "health",
    name: "Health",
    avatar: "❤️",
    description: "Wellness & fitness tracking",
    lastMessage: "Coming soon...",
    time: "Yesterday",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "spotify",
    name: "Spotify",
    avatar: "🎵",
    description: "Music & playlist management",
    lastMessage: "Coming soon...",
    time: "Yesterday",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "google-photos",
    name: "Google Photos",
    avatar: "📷",
    description: "Photo library & memories",
    lastMessage: "Coming soon...",
    time: "Yesterday",
    unreadCount: 0,
    color: "#25D366",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    avatar: "📁",
    description: "File storage & management",
    lastMessage: "Coming soon...",
    time: "Yesterday",
    unreadCount: 0,
    color: "#25D366",
  },
];

interface ContactListProps {
  onSelectContact: (agentId: string) => void;
  selectedAgentId?: string | null;
}

export default function ContactList({ onSelectContact, selectedAgentId }: ContactListProps) {
  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        selectedAgentId === item.id && styles.contactItemSelected
      ]}
      onPress={() => onSelectContact(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatar}>{item.avatar}</Text>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.contactTime}>{item.time}</Text>
        </View>
        <View style={styles.contactFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>lifeOS</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => {
            // Clear auth and reload
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.clear();
              window.location.reload();
            }
          }}>
            <Text style={styles.headerIcon}>🚪</Text>
          </TouchableOpacity>
          <Text style={styles.headerIcon}>⋮</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ask Meta AI or Search"
          placeholderTextColor="#667781"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Text style={[styles.tab, styles.tabActive]}>All</Text>
        <Text style={styles.tab}>Unread</Text>
        <Text style={styles.tab}>Favourites</Text>
        <Text style={styles.tab}>Groups</Text>
      </View>

      {/* Contacts List */}
      <FlatList
        data={AGENT_CONTACTS}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#202C33",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#E9EDEF",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 16,
  },
  headerIcon: {
    fontSize: 24,
    color: "#AEBAC1",
  },
  searchContainer: {
    padding: 8,
    backgroundColor: "#111B21",
  },
  searchInput: {
    backgroundColor: "#202C33",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#E9EDEF",
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#111B21",
  },
  tab: {
    fontSize: 14,
    color: "#8696A0",
    paddingVertical: 4,
  },
  tabActive: {
    color: "#00A884",
    borderBottomWidth: 2,
    borderBottomColor: "#00A884",
  },
  list: {
    flex: 1,
    backgroundColor: "#111B21",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111B21",
  },
  contactItemSelected: {
    backgroundColor: "#202C33",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#202C33",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    fontSize: 28,
  },
  contactInfo: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A3942",
    paddingBottom: 12,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "400",
    color: "#E9EDEF",
    flex: 1,
  },
  contactTime: {
    fontSize: 12,
    color: "#8696A0",
    marginLeft: 8,
  },
  contactFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#8696A0",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: "#111B21",
    fontSize: 12,
    fontWeight: "600",
  },
});
