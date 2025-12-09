//
//  CalAgent.swift
//  Echo - Calendar Agent
//
//  Created: 2025-12-02
//

import Foundation
import EventKit

class CalAgent: Agent {
    let id = "cal"
    let name = "Calendar"
    let description = "Manage your calendar events"
    let icon = "calendar"

    private let eventStore = EKEventStore()
    private var hasCalendarAccess = false

    init() {
        requestCalendarAccess()
    }

    func handle(query: String, context: [Message]) async -> AgentResponse {
        guard hasCalendarAccess else {
            return .error("Calendar access not granted. Please enable in Settings.")
        }

        // Parse intent using simple keyword detection
        // TODO: Use LLM for better intent detection
        let intent = detectIntent(from: query)

        switch intent {
        case .create:
            return await createEvent(from: query)
        case .list:
            return await listEvents(from: query)
        case .update:
            return await updateEvent(from: query)
        case .delete:
            return await deleteEvent(from: query)
        case .unknown:
            return .text("I can help you create, view, update, or delete calendar events. What would you like to do?")
        }
    }

    func configure(settings: [String: Any]) async {
        // Configure calendar settings
    }

    // MARK: - Calendar Access

    private func requestCalendarAccess() {
        eventStore.requestAccess(to: .event) { granted, error in
            self.hasCalendarAccess = granted
            if let error = error {
                print("❌ Calendar access error: \(error)")
            }
        }
    }

    // MARK: - Intent Detection

    private enum Intent {
        case create, list, update, delete, unknown
    }

    private func detectIntent(from query: String) -> Intent {
        let lowercased = query.lowercased()

        if lowercased.contains("add") || lowercased.contains("create") || lowercased.contains("schedule") {
            return .create
        } else if lowercased.contains("show") || lowercased.contains("what") || lowercased.contains("list") {
            return .list
        } else if lowercased.contains("move") || lowercased.contains("update") || lowercased.contains("change") {
            return .update
        } else if lowercased.contains("delete") || lowercased.contains("remove") || lowercased.contains("cancel") {
            return .delete
        }

        return .unknown
    }

    // MARK: - Event Operations

    private func createEvent(from query: String) async -> AgentResponse {
        // Parse event details from query
        // TODO: Use LLM to extract structured data
        guard let eventData = parseEventData(from: query) else {
            return .error("I couldn't understand the event details. Please provide title, date, and time.")
        }

        // Create event in EventKit
        let event = EKEvent(eventStore: eventStore)
        event.title = eventData.title
        event.startDate = eventData.startDate
        event.endDate = eventData.endDate
        event.calendar = eventStore.defaultCalendarForNewEvents

        do {
            try eventStore.save(event, span: .thisEvent)

            let card = AgentCard.calendar(
                AgentCard.CalendarCard(
                    event: CalendarEvent(
                        id: event.eventIdentifier,
                        title: event.title,
                        startDate: event.startDate,
                        endDate: event.endDate,
                        location: event.location,
                        notes: event.notes,
                        isAllDay: event.isAllDay
                    ),
                    canEdit: true,
                    canDelete: true
                )
            )

            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .medium
            dateFormatter.timeStyle = .short

            return AgentResponse(
                text: "✅ Added: \(event.title), \(dateFormatter.string(from: event.startDate))",
                card: card,
                actions: nil,
                error: nil
            )
        } catch {
            return .error("Failed to create event: \(error.localizedDescription)")
        }
    }

    private func listEvents(from query: String) async -> AgentResponse {
        // Determine time range from query
        let (startDate, endDate) = parseTimeRange(from: query)

        // Fetch events
        let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: nil)
        let events = eventStore.events(matching: predicate)

        if events.isEmpty {
            return .text("No events found for the specified time range.")
        }

        // Format events list
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .short
        dateFormatter.timeStyle = .short

        var response = "Here's what's on your calendar:\n\n"
        for event in events.prefix(10) {
            response += "• \(event.title) - \(dateFormatter.string(from: event.startDate))\n"
        }

        if events.count > 10 {
            response += "\n...and \(events.count - 10) more"
        }

        return .text(response)
    }

    private func updateEvent(from query: String) async -> AgentResponse {
        // TODO: Implement event update
        return .error("Event update not yet implemented")
    }

    private func deleteEvent(from query: String) async -> AgentResponse {
        // TODO: Implement event deletion
        return .error("Event deletion not yet implemented")
    }

    // MARK: - Parsing Helpers

    private func parseEventData(from query: String) -> (title: String, startDate: Date, endDate: Date)? {
        // Simplified parsing - in production, use LLM
        // Example: "Meeting with Sarah on Thursday at 3pm"

        // For now, return mock data for testing
        let title = query.components(separatedBy: " on ").first ?? "New Event"
        let startDate = Date().addingTimeInterval(86400) // Tomorrow
        let endDate = startDate.addingTimeInterval(3600) // 1 hour duration

        return (title, startDate, endDate)
    }

    private func parseTimeRange(from query: String) -> (start: Date, end: Date) {
        let calendar = Calendar.current
        let now = Date()

        let lowercased = query.lowercased()

        if lowercased.contains("today") {
            let start = calendar.startOfDay(for: now)
            let end = calendar.date(byAdding: .day, value: 1, to: start)!
            return (start, end)
        } else if lowercased.contains("tomorrow") {
            let start = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now))!
            let end = calendar.date(byAdding: .day, value: 1, to: start)!
            return (start, end)
        } else if lowercased.contains("week") {
            let start = calendar.startOfDay(for: now)
            let end = calendar.date(byAdding: .day, value: 7, to: start)!
            return (start, end)
        } else {
            // Default: next 30 days
            let start = calendar.startOfDay(for: now)
            let end = calendar.date(byAdding: .day, value: 30, to: start)!
            return (start, end)
        }
    }
}
