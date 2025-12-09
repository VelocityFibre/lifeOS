//
//  ContentView.swift
//  Echo - Main Chat Interface
//
//  Created: 2025-12-02
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var database: Database
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ChatViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Chat Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(database.messages) { message in
                                MessageRow(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: database.messages.count) { _ in
                        scrollToBottom(proxy: proxy)
                    }
                }

                // Input Area
                MessageInputView(
                    text: $viewModel.inputText,
                    onSend: {
                        await viewModel.sendMessage(database: database)
                    },
                    onAgentTap: {
                        appState.isAgentPickerVisible = true
                    }
                )
            }
            .navigationTitle("Echo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        // Open settings
                    }) {
                        Image(systemName: "gear")
                    }
                }
            }
            .sheet(isPresented: $appState.isAgentPickerVisible) {
                AgentPickerView(
                    onSelect: { agent in
                        viewModel.inputText = "@\(agent.id) "
                        appState.isAgentPickerVisible = false
                    }
                )
            }
        }
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        if let lastMessage = database.messages.last {
            withAnimation {
                proxy.scrollTo(lastMessage.id, anchor: .bottom)
            }
        }
    }
}

// MARK: - Message Row
struct MessageRow: View {
    let message: Message

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if message.isFromUser {
                Spacer()
                MessageBubble(message: message, isUser: true)
            } else {
                AgentAvatar(agentId: message.agentName ?? "system")
                MessageBubble(message: message, isUser: false)
                Spacer()
            }
        }
    }
}

// MARK: - Message Bubble
struct MessageBubble: View {
    let message: Message
    let isUser: Bool

    var body: some View {
        VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
            Text(message.content)
                .padding(12)
                .background(isUser ? Color.blue : Color(.systemGray6))
                .foregroundColor(isUser ? .white : .primary)
                .cornerRadius(16)

            Text(formatTimestamp(message.timestamp))
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: 280, alignment: isUser ? .trailing : .leading)
    }

    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Agent Avatar
struct AgentAvatar: View {
    let agentId: String

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 32, height: 32)

            Image(systemName: iconForAgent(agentId))
                .font(.system(size: 16))
                .foregroundColor(.blue)
        }
    }

    private func iconForAgent(_ id: String) -> String {
        switch id {
        case "mem": return "brain.head.profile"
        case "cal": return "calendar"
        case "mail": return "envelope"
        default: return "sparkles"
        }
    }
}

// MARK: - Message Input View
struct MessageInputView: View {
    @Binding var text: String
    let onSend: () async -> Void
    let onAgentTap: () -> Void

    @State private var isSending = false

    var body: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: 12) {
                // @ Agent Button
                Button(action: onAgentTap) {
                    Image(systemName: "at")
                        .font(.system(size: 20))
                        .foregroundColor(.blue)
                        .frame(width: 32, height: 32)
                }

                // Text Input
                TextField("Message...", text: $text, axis: .vertical)
                    .textFieldStyle(.plain)
                    .lineLimit(1...5)
                    .disabled(isSending)

                // Send Button
                Button(action: {
                    Task {
                        isSending = true
                        await onSend()
                        isSending = false
                    }
                }) {
                    Image(systemName: isSending ? "arrow.up.circle.fill" : "arrow.up.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(text.isEmpty ? .gray : .blue)
                }
                .disabled(text.isEmpty || isSending)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - Agent Picker
struct AgentPickerView: View {
    let onSelect: (Agent) -> Void
    @Environment(\.dismiss) var dismiss

    private let agents = AgentManager.shared.getAllAgents()

    var body: some View {
        NavigationView {
            List(agents, id: \.id) { agent in
                Button(action: {
                    onSelect(agent)
                    dismiss()
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: agent.icon)
                            .font(.system(size: 24))
                            .foregroundColor(.blue)
                            .frame(width: 40, height: 40)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(agent.name)
                                .font(.headline)
                            Text(agent.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()
                    }
                }
            }
            .navigationTitle("Choose Agent")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Chat View Model
@MainActor
class ChatViewModel: ObservableObject {
    @Published var inputText = ""

    func sendMessage(database: Database) async {
        guard !inputText.isEmpty else { return }

        let messageText = inputText
        inputText = "" // Clear input immediately

        // Save user message
        let userMessage = Message(content: messageText, sender: "user")
        database.saveMessage(userMessage)

        // Process with agent
        let response = await AgentManager.shared.handleQuery(
            messageText,
            context: Array(database.messages.suffix(10))
        )

        // Save agent response
        let agentMessage = Message(
            content: response.text ?? response.error ?? "No response",
            sender: detectAgentFromQuery(messageText)
        )
        database.saveMessage(agentMessage)
    }

    private func detectAgentFromQuery(_ query: String) -> String {
        if query.hasPrefix("@mem") { return "agent:mem" }
        if query.hasPrefix("@cal") { return "agent:cal" }
        if query.hasPrefix("@mail") { return "agent:mail" }
        return "agent:system"
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AppState())
            .environmentObject(Database.shared)
    }
}
