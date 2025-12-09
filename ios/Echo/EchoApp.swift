//
//  EchoApp.swift
//  Echo - Your Personal OS
//
//  Created: 2025-12-02
//

import SwiftUI

@main
struct EchoApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var database = Database.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(database)
                .onAppear {
                    setupApp()
                }
        }
    }

    private func setupApp() {
        // Initialize database
        database.initialize()

        // Register agents
        AgentManager.shared.registerDefaultAgents()

        // Check for first launch
        if !UserDefaults.standard.bool(forKey: "hasLaunchedBefore") {
            showWelcomeMessage()
            UserDefaults.standard.set(true, forKey: "hasLaunchedBefore")
        }
    }

    private func showWelcomeMessage() {
        // Add welcome message to chat
        let welcomeMessage = Message(
            content: "Welcome to Echo. This is your personal space. Try asking @mem, @cal, or @mail for help.",
            sender: "system",
            timestamp: Date()
        )
        database.saveMessage(welcomeMessage)
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var selectedAgent: Agent?
    @Published var isAgentPickerVisible = false
    @Published var currentTheme: Theme = .system

    enum Theme {
        case light, dark, system
    }
}
