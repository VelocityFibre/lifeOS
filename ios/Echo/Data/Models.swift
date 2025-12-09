//
//  Models.swift
//  Echo - Data Models
//
//  Created: 2025-12-02
//

import Foundation

// MARK: - Message Model
struct Message: Identifiable, Codable, Equatable {
    let id: String
    let content: String
    let sender: String // "user" or "agent:mem"
    let timestamp: Date
    var metadata: MessageMetadata?
    var embedding: [Float]?

    init(
        id: String = UUID().uuidString,
        content: String,
        sender: String = "user",
        timestamp: Date = Date(),
        metadata: MessageMetadata? = nil,
        embedding: [Float]? = nil
    ) {
        self.id = id
        self.content = content
        self.sender = sender
        self.timestamp = timestamp
        self.metadata = metadata
        self.embedding = embedding
    }

    var isFromUser: Bool {
        sender == "user"
    }

    var isFromAgent: Bool {
        sender.hasPrefix("agent:")
    }

    var agentName: String? {
        guard isFromAgent else { return nil }
        return sender.replacingOccurrences(of: "agent:", with: "")
    }
}

// MARK: - Message Metadata
struct MessageMetadata: Codable, Equatable {
    var attachments: [Attachment]?
    var reactions: [Reaction]?
    var replyTo: String? // Message ID
    var edited: Bool = false
    var editedAt: Date?

    struct Reaction: Codable, Equatable {
        let emoji: String
        let timestamp: Date
    }
}

// MARK: - Attachment Model
struct Attachment: Identifiable, Codable, Equatable {
    let id: String
    let messageId: String
    let type: AttachmentType
    let filePath: String
    let size: Int64
    let fileName: String?
    let mimeType: String?

    init(
        id: String = UUID().uuidString,
        messageId: String,
        type: AttachmentType,
        filePath: String,
        size: Int64,
        fileName: String? = nil,
        mimeType: String? = nil
    ) {
        self.id = id
        self.messageId = messageId
        self.type = type
        self.filePath = filePath
        self.size = size
        self.fileName = fileName
        self.mimeType = mimeType
    }

    enum AttachmentType: String, Codable {
        case image
        case video
        case pdf
        case voice
        case document
        case other
    }
}

// MARK: - Agent Response Model
struct AgentResponse {
    let text: String?
    let card: AgentCard?
    let actions: [AgentAction]?
    let error: String?

    static func text(_ content: String) -> AgentResponse {
        AgentResponse(text: content, card: nil, actions: nil, error: nil)
    }

    static func error(_ message: String) -> AgentResponse {
        AgentResponse(text: nil, card: nil, actions: nil, error: message)
    }
}

// MARK: - Agent Card (Structured UI)
enum AgentCard {
    case calendar(CalendarCard)
    case email(EmailCard)
    case searchResults(SearchResultsCard)
    case task(TaskCard)

    struct CalendarCard {
        let event: CalendarEvent
        let canEdit: Bool
        let canDelete: Bool
    }

    struct EmailCard {
        let subject: String
        let sender: String
        let preview: String
        let timestamp: Date
        let emailId: String
    }

    struct SearchResultsCard {
        let query: String
        let results: [SearchResult]
        let totalCount: Int

        struct SearchResult {
            let message: Message
            let score: Float
            let highlights: [String]
        }
    }

    struct TaskCard {
        let title: String
        let dueDate: Date?
        let completed: Bool
        let taskId: String
    }
}

// MARK: - Agent Action
struct AgentAction {
    let id: String
    let title: String
    let style: ActionStyle
    let handler: () async -> Void

    enum ActionStyle {
        case primary
        case secondary
        case destructive
    }
}

// MARK: - Calendar Event Model
struct CalendarEvent: Identifiable, Codable {
    let id: String
    var title: String
    var startDate: Date
    var endDate: Date
    var location: String?
    var notes: String?
    var isAllDay: Bool
    var calendarId: String?

    init(
        id: String = UUID().uuidString,
        title: String,
        startDate: Date,
        endDate: Date,
        location: String? = nil,
        notes: String? = nil,
        isAllDay: Bool = false,
        calendarId: String? = nil
    ) {
        self.id = id
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.location = location
        self.notes = notes
        self.isAllDay = isAllDay
        self.calendarId = calendarId
    }
}

// MARK: - Email Model
struct Email: Identifiable, Codable {
    let id: String
    let subject: String
    let sender: EmailAddress
    let recipients: [EmailAddress]
    let body: String
    let timestamp: Date
    let isRead: Bool
    let hasAttachments: Bool
    let labels: [String]

    struct EmailAddress: Codable {
        let name: String?
        let email: String
    }
}

// MARK: - Agent Configuration
struct AgentConfig: Codable {
    let agentId: String
    var enabled: Bool
    var settings: [String: String]

    init(agentId: String, enabled: Bool = true, settings: [String: String] = [:]) {
        self.agentId = agentId
        self.enabled = enabled
        self.settings = settings
    }
}
