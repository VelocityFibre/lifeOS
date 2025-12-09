//
//  MailAgent.swift
//  Echo - Email Agent
//
//  Created: 2025-12-02
//

import Foundation

class MailAgent: Agent {
    let id = "mail"
    let name = "Mail"
    let description = "Manage your email"
    let icon = "envelope"

    private var isConnected = false
    private var cachedEmails: [Email] = []

    func handle(query: String, context: [Message]) async -> AgentResponse {
        // Check if email account is connected
        guard isConnected else {
            return .text("Please connect your email account first. Go to Settings → Email to add Gmail or Outlook.")
        }

        // Parse intent
        let intent = detectIntent(from: query)

        switch intent {
        case .list:
            return await listEmails(from: query)
        case .search:
            return await searchEmails(from: query)
        case .read:
            return await readEmail(from: query)
        case .reply:
            return await replyToEmail(from: query)
        case .compose:
            return await composeEmail(from: query)
        case .unknown:
            return .text("I can help you read, search, reply to, or compose emails. What would you like to do?")
        }
    }

    func configure(settings: [String: Any]) async {
        // Configure email account (OAuth tokens, etc.)
        if let oauthToken = settings["oauthToken"] as? String {
            await connectEmail(with: oauthToken)
        }
    }

    // MARK: - Email Connection

    private func connectEmail(with token: String) async {
        // TODO: Implement OAuth flow for Gmail/Outlook
        // For now, simulate connection
        isConnected = true
        await loadEmails()
    }

    private func loadEmails() async {
        // TODO: Fetch emails from Gmail/Outlook API
        // For now, use mock data
        cachedEmails = generateMockEmails()
    }

    // MARK: - Intent Detection

    private enum Intent {
        case list, search, read, reply, compose, unknown
    }

    private func detectIntent(from query: String) -> Intent {
        let lowercased = query.lowercased()

        if lowercased.contains("show") || lowercased.contains("list") || lowercased.contains("unread") {
            return .list
        } else if lowercased.contains("search") || lowercased.contains("find") {
            return .search
        } else if lowercased.contains("read") || lowercased.contains("open") {
            return .read
        } else if lowercased.contains("reply") {
            return .reply
        } else if lowercased.contains("compose") || lowercased.contains("draft") || lowercased.contains("send") {
            return .compose
        }

        return .unknown
    }

    // MARK: - Email Operations

    private func listEmails(from query: String) async -> AgentResponse {
        // Filter for unread if specified
        let showUnread = query.lowercased().contains("unread")
        let emails = showUnread ? cachedEmails.filter { !$0.isRead } : cachedEmails

        if emails.isEmpty {
            return .text(showUnread ? "No unread emails! 🎉" : "No emails found.")
        }

        // Format email list
        var response = showUnread ? "You have \(emails.count) unread emails:\n\n" : "Recent emails:\n\n"

        for email in emails.prefix(5) {
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .short
            dateFormatter.timeStyle = .short

            response += "📧 **\(email.subject)**\n"
            response += "   From: \(email.sender.name ?? email.sender.email)\n"
            response += "   \(dateFormatter.string(from: email.timestamp))\n\n"
        }

        if emails.count > 5 {
            response += "...and \(emails.count - 5) more"
        }

        return .text(response)
    }

    private func searchEmails(from query: String) async -> AgentResponse {
        // Extract search query
        let searchQuery = query.replacingOccurrences(of: "search", with: "")
            .replacingOccurrences(of: "find", with: "")
            .trimmingCharacters(in: .whitespaces)

        let results = cachedEmails.filter { email in
            email.subject.lowercased().contains(searchQuery.lowercased()) ||
            email.body.lowercased().contains(searchQuery.lowercased()) ||
            email.sender.email.lowercased().contains(searchQuery.lowercased())
        }

        if results.isEmpty {
            return .text("No emails found matching '\(searchQuery)'")
        }

        var response = "Found \(results.count) emails matching '\(searchQuery)':\n\n"

        for email in results.prefix(5) {
            response += "📧 \(email.subject) - \(email.sender.name ?? email.sender.email)\n"
        }

        return .text(response)
    }

    private func readEmail(from query: String) async -> AgentResponse {
        // For demo, return the first email
        guard let email = cachedEmails.first else {
            return .error("No emails to read")
        }

        let card = AgentCard.email(
            AgentCard.EmailCard(
                subject: email.subject,
                sender: email.sender.name ?? email.sender.email,
                preview: String(email.body.prefix(200)),
                timestamp: email.timestamp,
                emailId: email.id
            )
        )

        return AgentResponse(
            text: "Here's the email:",
            card: card,
            actions: [
                AgentAction(id: "reply", title: "Reply", style: .primary) {
                    // TODO: Open reply composer
                },
                AgentAction(id: "archive", title: "Archive", style: .secondary) {
                    // TODO: Archive email
                }
            ],
            error: nil
        )
    }

    private func replyToEmail(from query: String) async -> AgentResponse {
        // Extract reply content after "reply:"
        // TODO: Use LLM to draft better replies
        let replyContent = query.replacingOccurrences(of: "reply", with: "")
            .replacingOccurrences(of: "to", with: "")
            .trimmingCharacters(in: .whitespaces)

        return .text("Draft reply created:\n\n\(replyContent)\n\nWould you like to send this?")
    }

    private func composeEmail(from query: String) async -> AgentResponse {
        // TODO: Parse recipient and content using LLM
        // For now, simple response
        return .text("Email composer opened. What would you like to write?")
    }

    // MARK: - Mock Data

    private func generateMockEmails() -> [Email] {
        return [
            Email(
                id: UUID().uuidString,
                subject: "Q4 Planning Meeting",
                sender: Email.EmailAddress(name: "Sarah Johnson", email: "sarah@company.com"),
                recipients: [Email.EmailAddress(name: nil, email: "me@email.com")],
                body: "Hi, let's schedule a meeting to discuss Q4 planning...",
                timestamp: Date().addingTimeInterval(-3600),
                isRead: false,
                hasAttachments: false,
                labels: ["work", "important"]
            ),
            Email(
                id: UUID().uuidString,
                subject: "Your Amazon order has shipped",
                sender: Email.EmailAddress(name: "Amazon", email: "no-reply@amazon.com"),
                recipients: [Email.EmailAddress(name: nil, email: "me@email.com")],
                body: "Your order #123-456 has been shipped and will arrive...",
                timestamp: Date().addingTimeInterval(-7200),
                isRead: false,
                hasAttachments: true,
                labels: ["shopping"]
            ),
            Email(
                id: UUID().uuidString,
                subject: "Weekend plans?",
                sender: Email.EmailAddress(name: "Mike Chen", email: "mike@gmail.com"),
                recipients: [Email.EmailAddress(name: nil, email: "me@email.com")],
                body: "Hey! Want to grab coffee this weekend?",
                timestamp: Date().addingTimeInterval(-86400),
                isRead: true,
                hasAttachments: false,
                labels: ["personal"]
            )
        ]
    }
}
