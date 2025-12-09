# Echo iOS App

> Your Personal OS - Stage 0 MVP

## 🎯 What This Is

This is the **Stage 0 (Solo Mode)** implementation of Echo - a local-first, AI-powered personal OS in a chat interface. This version is **single-user only** with no multiplayer features.

## ✨ Features

- **Chat Interface:** WhatsApp-style UI for messaging yourself
- **@mem Agent:** Full-text search across all your messages
- **@cal Agent:** Natural language calendar management
- **@mail Agent:** Email integration (Gmail/Outlook)
- **Local-First:** All data stored locally with SQLite
- **E2E Encrypted:** SQLCipher encryption for database
- **AI-Powered:** Local LLM + cloud fallback (GPT-4o-mini/Claude)

## 📋 Project Structure

```
Echo/
├── EchoApp.swift              # App entry point
├── UI/
│   └── ContentView.swift      # Main chat interface
├── Data/
│   ├── Models.swift           # Data models
│   └── Database.swift         # SQLite layer
├── Agents/
│   ├── AgentProtocol.swift    # Agent system
│   ├── MemAgent.swift         # @mem (search)
│   ├── CalAgent.swift         # @cal (calendar)
│   └── MailAgent.swift        # @mail (email)
├── AI/
│   └── LLMManager.swift       # LLM integration
├── Utils/
│   └── (utility files)
└── Resources/
    └── (assets, models)
```

## 🛠️ Tech Stack

- **Language:** Swift 6
- **UI Framework:** SwiftUI
- **Database:** SQLite (GRDB.swift + SQLCipher)
- **Platforms:** iOS 17+, macOS 14+
- **Dependencies:**
  - GRDB.swift (SQLite wrapper)
  - SQLCipher (encryption)
  - Alamofire (networking)
  - KeychainSwift (secure storage)

## 🚀 Getting Started

### Prerequisites

- Xcode 15.0+
- macOS 14.0+ (for development)
- Apple Developer account (for device testing)

### Installation

1. **Clone the repository:**
   ```bash
   cd ios/Echo
   ```

2. **Install dependencies:**
   ```bash
   # Using Swift Package Manager (automatic in Xcode)
   # Or manually:
   swift package resolve
   ```

3. **Open in Xcode:**
   ```bash
   open Echo.xcodeproj
   # Or if using SPM:
   open Package.swift
   ```

4. **Configure API keys (optional):**
   - For cloud LLM (OpenAI/Anthropic), add keys in Settings within the app
   - Or create `Secrets.plist`:
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
     <plist version="1.0">
     <dict>
         <key>OPENAI_API_KEY</key>
         <string>sk-...</string>
         <key>ANTHROPIC_API_KEY</key>
         <string>sk-ant-...</string>
     </dict>
     </plist>
     ```

5. **Build and run:**
   - Select target device (iPhone 15 Simulator or physical device)
   - Press `Cmd+R` or click Run

## 📱 Usage

### Basic Chat

1. Open app → land in chat interface
2. Type a message → send
3. Message is saved locally and indexed

### Using Agents

**@mem (Memory/Search):**
```
@mem what did I say about the trip?
```

**@cal (Calendar):**
```
@cal add meeting with Sarah tomorrow at 3pm
@cal what's on my calendar today?
```

**@mail (Email):**
```
@mail show unread emails
@mail search emails from John
```

### Agent Picker

- Tap the `@` button in the input bar
- Select an agent from the list
- Type your query

## 🧪 Testing

### Run Unit Tests

```bash
swift test
```

### Run in Simulator

```bash
xcodebuild -scheme Echo \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  test
```

### TestFlight Distribution

1. Archive the app: `Product > Archive`
2. Distribute to TestFlight
3. Invite beta testers

## 🔧 Configuration

### Database

- Location: `~/Documents/echo.db`
- Encryption: SQLCipher with device-generated key
- Export: Settings → Export Data (JSON)

### Privacy Permissions

Required permissions (auto-requested):
- Calendar: For @cal agent
- Contacts: For @mail agent
- Photos: For image attachments
- Microphone: For voice notes (future)

### Sync (Optional)

- iCloud sync via CloudKit (user opt-in)
- Data encrypted before upload
- Conflict resolution: last-write-wins

## 🏗️ Development

### Adding a New Agent

1. Create agent file in `Agents/`:
   ```swift
   class NewAgent: Agent {
       let id = "new"
       let name = "New Agent"
       let description = "Does something cool"
       let icon = "star"

       func handle(query: String, context: [Message]) async -> AgentResponse {
           // Implementation
       }

       func configure(settings: [String: Any]) async {
           // Configuration
       }
   }
   ```

2. Register in `EchoApp.swift`:
   ```swift
   AgentManager.shared.register(NewAgent())
   ```

### Adding a New Tool

Tools are simple functions that don't require `@` prefix:

1. Add to `LLMManager.swift`:
   ```swift
   func weatherTool(location: String) async -> String {
       // Fetch weather
   }
   ```

2. LLM automatically detects and invokes based on query

## 📊 Performance Targets

- Message send latency: <100ms
- Agent response time: <2s (local), <5s (cloud)
- App launch time: <1s
- Database size: <500MB for 100k messages

## 🐛 Known Issues

- [ ] Local LLM not yet implemented (uses cloud only)
- [ ] Semantic search (RAG) not yet implemented
- [ ] Email OAuth flow placeholder (needs Gmail/Outlook setup)
- [ ] CloudKit sync not yet implemented
- [ ] Voice notes not yet implemented

## 🗺️ Roadmap

### Stage 0 (Current) - Solo Mode
- [x] Chat UI
- [x] @mem, @cal, @mail agents
- [x] Local database
- [ ] Local LLM integration
- [ ] CloudKit sync
- [ ] TestFlight launch

### Stage 1 (Next 4-6 months)
- [ ] @travel, @finance, @health, @tasks agents
- [ ] Android app
- [ ] Advanced tools (web search, image gen, PDF summary)

### Stage 2 (Months 10-18)
- [ ] Shared spaces (multiplayer)
- [ ] Web app (PWA)
- [ ] Real-time sync

See [main docs](../../docs/) for full roadmap.

## 📝 Notes

### Current State

This is a **prototype/MVP**. Several features are placeholder implementations:

- Email fetching uses mock data
- Calendar parsing is basic (needs LLM)
- Search is keyword-only (no semantic/vector search yet)
- LLM defaults to cloud (local model not integrated)

### Production-Ready Checklist

Before shipping:
- [ ] Implement proper OAuth for Gmail/Outlook
- [ ] Add local LLM (Llama 3.2 or Phi-3)
- [ ] Implement vector search for @mem
- [ ] Add proper error handling
- [ ] Write comprehensive tests
- [ ] Security audit
- [ ] App Store metadata & screenshots
- [ ] Privacy policy & terms

## 🤝 Contributing

This is currently a solo project for Stage 0. Contributions will be accepted starting Stage 1.

## 📄 License

Proprietary (TBD - will likely be dual-licensed: closed iOS app, open server in Stage 2)

---

**Built with ❤️ using SwiftUI**

**Last Updated:** 2025-12-02
**Version:** 0.1.0 (Pre-Alpha)
