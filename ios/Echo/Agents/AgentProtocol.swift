//
//  AgentProtocol.swift
//  Echo - Agent System
//
//  Created: 2025-12-02
//

import Foundation

// MARK: - Agent Protocol
protocol Agent {
    var id: String { get }
    var name: String { get }
    var description: String { get }
    var icon: String { get } // SF Symbol name

    func handle(query: String, context: [Message]) async -> AgentResponse
    func configure(settings: [String: Any]) async
}

// MARK: - Agent Manager
class AgentManager: ObservableObject {
    static let shared = AgentManager()

    @Published var registeredAgents: [String: Agent] = [:]

    private init() {}

    func registerDefaultAgents() {
        register(MemAgent())
        register(CalAgent())
        register(MailAgent())
    }

    func register(_ agent: Agent) {
        registeredAgents[agent.id] = agent
        print("✅ Registered agent: \(agent.name)")
    }

    func getAgent(_ id: String) -> Agent? {
        return registeredAgents[id]
    }

    func getAllAgents() -> [Agent] {
        return Array(registeredAgents.values).sorted { $0.name < $1.name }
    }

    func handleQuery(_ query: String, context: [Message] = []) async -> AgentResponse {
        // Detect which agent to invoke
        if let agentId = detectAgent(from: query) {
            guard let agent = getAgent(agentId) else {
                return .error("Agent '\(agentId)' not found")
            }

            // Remove @agent prefix from query
            let cleanQuery = query.replacingOccurrences(of: "@\(agentId)", with: "").trimmingCharacters(in: .whitespaces)

            return await agent.handle(query: cleanQuery, context: context)
        } else {
            // No agent detected, treat as regular message or use general LLM
            return await handleGeneralQuery(query, context: context)
        }
    }

    private func detectAgent(from query: String) -> String? {
        // Check if query starts with @agentname
        let pattern = "^@(\\w+)"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: query, range: NSRange(query.startIndex..., in: query)),
              let range = Range(match.range(at: 1), in: query) else {
            return nil
        }

        return String(query[range])
    }

    private func handleGeneralQuery(_ query: String, context: [Message]) async -> AgentResponse {
        // Use LLM to determine intent or provide general response
        // For now, return simple echo
        return .text("I received: \(query)")
    }
}
