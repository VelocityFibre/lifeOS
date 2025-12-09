//
//  MemAgent.swift
//  Echo - Memory & Search Agent
//
//  Created: 2025-12-02
//

import Foundation

class MemAgent: Agent {
    let id = "mem"
    let name = "Memory"
    let description = "Search your messages and notes"
    let icon = "brain.head.profile"

    private let database = Database.shared

    func handle(query: String, context: [Message]) async -> AgentResponse {
        // Handle different search intents
        if query.isEmpty {
            return .text("What would you like me to search for?")
        }

        // Perform search
        let results = searchMessages(query: query)

        if results.isEmpty {
            return .text("I couldn't find anything matching '\(query)'.")
        }

        // Generate summary using LLM (simplified for now)
        let summary = generateSummary(query: query, results: results)

        // Create search results card
        let card = AgentCard.searchResults(
            AgentCard.SearchResultsCard(
                query: query,
                results: results.map { message in
                    AgentCard.SearchResultsCard.SearchResult(
                        message: message,
                        score: 1.0,
                        highlights: extractHighlights(from: message.content, query: query)
                    )
                },
                totalCount: results.count
            )
        )

        return AgentResponse(text: summary, card: card, actions: nil, error: nil)
    }

    func configure(settings: [String: Any]) async {
        // Configure search settings (e.g., enable semantic search)
    }

    // MARK: - Private Methods

    private func searchMessages(query: String) -> [Message] {
        // Perform hybrid search (keyword + semantic)
        let keywordResults = database.searchMessages(query: query, limit: 20)

        // TODO: Add semantic search using embeddings
        // let semanticResults = database.vectorSearch(embedding: embedQuery(query), limit: 20)
        // return hybridSearch(keyword: keywordResults, semantic: semanticResults)

        return keywordResults
    }

    private func generateSummary(query: String, results: [Message]) -> String {
        // TODO: Use LLM to generate intelligent summary
        // For now, simple summary
        if results.count == 1 {
            return "I found 1 message about '\(query)':"
        } else {
            return "I found \(results.count) messages about '\(query)':"
        }
    }

    private func extractHighlights(from text: String, query: String) -> [String] {
        // Extract snippets containing query terms
        let words = query.lowercased().split(separator: " ")
        var highlights: [String] = []

        for word in words {
            if let range = text.range(of: String(word), options: .caseInsensitive) {
                let start = text.index(range.lowerBound, offsetBy: -20, limitedBy: text.startIndex) ?? text.startIndex
                let end = text.index(range.upperBound, offsetBy: 20, limitedBy: text.endIndex) ?? text.endIndex
                let snippet = String(text[start..<end])
                highlights.append("...\(snippet)...")
            }
        }

        return highlights.isEmpty ? [String(text.prefix(100))] : highlights
    }
}
