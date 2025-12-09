# Technical Architecture

**Version:** 1.0
**Last Updated:** 2025-12-02
**Scope:** All stages (0–3)

---

## Architecture Principles

1. **Local-First:** Data lives on device, syncs to cloud as backup
2. **Privacy by Default:** End-to-end encryption, zero-knowledge server
3. **Progressive Enhancement:** Works offline, syncs when online
4. **Platform Native:** iOS/macOS/Android native apps (no web wrappers)
5. **Agent Modularity:** Agents as plugins, easy to add/remove
6. **Minimal Server:** Start serverless, add infrastructure only when needed

---

## Stage 0 Architecture (Solo Mode)

### Client (iOS + macOS)

**Tech Stack:**
- **Language:** Swift 6
- **UI Framework:** SwiftUI
- **Database:** SQLite (via GRDB.swift)
- **Encryption:** SQLCipher (encrypted SQLite)
- **Sync:** CloudKit (optional, user-enabled)

**App Structure:**

```
App/
├── UI/
│   ├── ChatView.swift          # Main chat interface
│   ├── MessageRow.swift        # Individual message cells
│   ├── AgentCard.swift         # Agent response cards
│   └── SettingsView.swift      # User settings
├── Data/
│   ├── Database.swift          # SQLite setup + migrations
│   ├── Message.swift           # Message model
│   ├── Agent.swift             # Agent model
│   └── Sync.swift              # CloudKit sync logic
├── Agents/
│   ├── AgentProtocol.swift     # Base agent interface
│   ├── MemAgent.swift          # @mem implementation
│   ├── CalAgent.swift          # @cal implementation
│   └── MailAgent.swift         # @mail implementation
├── AI/
│   ├── LLMManager.swift        # Handles local + cloud LLMs
│   ├── EmbeddingModel.swift    # Vector embeddings for RAG
│   └── FunctionCalling.swift   # Tool/function execution
└── Utils/
    ├── Crypto.swift            # Encryption helpers
    └── Extensions.swift        # Swift extensions
```

---

### Data Model (SQLite Schema)

**Messages Table:**
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,                -- UUID
    content TEXT NOT NULL,              -- Encrypted message content
    sender TEXT DEFAULT 'user',         -- 'user' or 'agent:mem'
    timestamp INTEGER NOT NULL,         -- Unix timestamp (ms)
    metadata TEXT,                      -- JSON (attachments, reactions, etc.)
    embedding BLOB,                     -- Vector embedding (for RAG)
    indexed INTEGER DEFAULT 0           -- 1 if indexed for search
);

CREATE VIRTUAL TABLE messages_fts USING fts5(content);  -- Full-text search
CREATE INDEX idx_timestamp ON messages(timestamp);
```

**Agents Table:**
```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY,                -- 'mem', 'cal', 'mail'
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    config TEXT                         -- JSON config (API keys, settings)
);
```

**Attachments Table:**
```sql
CREATE TABLE attachments (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    type TEXT NOT NULL,                 -- 'image', 'pdf', 'voice'
    file_path TEXT NOT NULL,            -- Local file path
    size INTEGER,
    FOREIGN KEY (message_id) REFERENCES messages(id)
);
```

---

### Local AI Models

**On-Device LLM:**
- **Model:** Llama 3.2 1B (or Phi-3 Mini)
- **Framework:** Core ML (iOS) or llama.cpp
- **Use Cases:**
  - Simple queries ("what's 15% of 200?")
  - Intent detection (which agent to invoke)
  - Fast, private responses

**Cloud LLM (Fallback):**
- **Model:** GPT-4o-mini or Claude 3.5 Haiku
- **Use Cases:**
  - Complex reasoning
  - Long context (email drafting, summarization)
  - When on-device model is unsure (confidence < 0.7)

**Embeddings Model:**
- **Model:** all-MiniLM-L6-v2 (local, 80MB)
- **Use:** Generate embeddings for messages (RAG)
- **Storage:** BLOB column in SQLite

---

### Agent Architecture

**Agent Protocol:**

```swift
protocol Agent {
    var id: String { get }
    var name: String { get }
    var description: String { get }

    func handle(query: String, context: [Message]) async -> AgentResponse
    func configure(settings: [String: Any]) async
}

struct AgentResponse {
    let text: String?
    let card: AgentCard?       // Structured UI (calendar event, email preview)
    let actions: [Action]?     // Buttons (Reply, Delete, etc.)
}
```

**Example: @mem Agent**

```swift
class MemAgent: Agent {
    let id = "mem"
    let name = "Memory"
    let description = "Search your messages and notes"

    func handle(query: String, context: [Message]) async -> AgentResponse {
        // 1. Generate embedding for query
        let embedding = await embeddingModel.encode(query)

        // 2. Vector search (semantic)
        let semanticResults = database.vectorSearch(embedding, limit: 20)

        // 3. Keyword search (FTS5)
        let keywordResults = database.ftsSearch(query, limit: 20)

        // 4. Hybrid: combine + re-rank with LLM
        let combined = hybridSearch(semanticResults, keywordResults)

        // 5. Generate summary
        let summary = await llm.generate(
            prompt: "Summarize these messages about: \(query)\n\(combined)"
        )

        return AgentResponse(text: summary, card: nil, actions: nil)
    }
}
```

---

### CloudKit Sync (Optional)

**How It Works:**
1. User enables sync in settings
2. Messages encrypted locally, uploaded to CloudKit
3. Other devices download + decrypt
4. Conflict resolution: last-write-wins (timestamp)

**CloudKit Schema:**

```
Record Type: Message
Fields:
- id (String)
- encryptedContent (Bytes)  // Can't be decrypted by Apple
- timestamp (Date)
- deviceId (String)
```

**Privacy:**
- CloudKit stores encrypted blobs (Apple cannot read)
- Encryption key stored in Keychain (never uploaded)

---

## Stage 1 Architecture (Power User)

### New Agents

**@travel, @finance, @health, @tasks:**
- Same protocol as Stage 0 agents
- Additional API integrations (Plaid, FlightAware, HealthKit)

**API Key Storage:**
- **Secure:** Keychain (iOS/macOS)
- **User-Controlled:** User enters API keys in settings (or OAuth)

---

### Android App

**Tech Stack:**
- **Language:** Kotlin
- **UI:** Jetpack Compose
- **Database:** SQLite (via Room)
- **Encryption:** SQLCipher
- **Sync:** Google Drive (instead of iCloud)

**Code Sharing:**
- Agent logic: Kotlin Multiplatform (shared with iOS)
- UI: Platform-specific (SwiftUI, Compose)

---

## Stage 2 Architecture (Shared Spaces)

### Server Infrastructure (NEW)

**Why Now?**
- Multi-user sync requires central server (can't use iCloud/Drive)
- Need WebSockets for real-time updates

**Tech Stack:**
- **Language:** TypeScript (Node.js) or Go
- **Framework:** Express.js or Hono (TypeScript), or Gin (Go)
- **Database:** PostgreSQL (managed: AWS RDS or Supabase)
- **Real-Time:** WebSockets (Socket.io or native WebSocket)
- **Hosting:** Railway, Fly.io, or AWS ECS

**Server Responsibilities:**
1. Store encrypted messages (can't decrypt)
2. Sync messages to space members
3. Manage space memberships (invites, permissions)
4. Push notifications (via FCM/APNs)

**What Server CANNOT Do:**
- Read message content (E2E encrypted)
- Access user data without device key

---

### Database Schema (Server)

**Spaces Table:**
```sql
CREATE TABLE spaces (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,                 -- Encrypted (server can't read)
    created_at TIMESTAMP DEFAULT NOW(),
    admin_user_id UUID NOT NULL
);
```

**Space Members:**
```sql
CREATE TABLE space_members (
    space_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member',         -- 'admin', 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (space_id, user_id),
    FOREIGN KEY (space_id) REFERENCES spaces(id)
);
```

**Messages (Server):**
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    space_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    encrypted_content BYTEA NOT NULL,   -- E2E encrypted
    timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (space_id) REFERENCES spaces(id)
);

CREATE INDEX idx_space_timestamp ON messages(space_id, timestamp);
```

---

### E2E Encryption (Multi-User)

**Protocol:** Signal Protocol (Double Ratchet)

**Key Exchange:**
1. User A creates space → generates space key
2. User A invites User B
3. User A encrypts space key with User B's public key
4. User B decrypts space key with private key
5. Both users share same space key → encrypt/decrypt messages

**Implementation:**
- **Library:** libsignal-client (Rust, with Swift/Kotlin bindings)
- **Keys:**
  - Identity Key: long-term, stored in Keychain
  - Space Key: per-space, rotated on member changes

**Security Properties:**
- Forward secrecy (past messages safe if key compromised)
- Break-in recovery (future messages safe after key rotation)

---

### Real-Time Sync (WebSockets)

**Flow:**
1. User opens space → connects to WebSocket (wss://server.com/ws)
2. Server authenticates (JWT token)
3. User sends message → server broadcasts to all space members
4. Members receive encrypted message → decrypt locally

**WebSocket Events:**

```typescript
// Client → Server
{
  type: 'message:send',
  spaceId: 'uuid',
  encryptedContent: 'base64...',
  timestamp: 1234567890
}

// Server → Client
{
  type: 'message:received',
  spaceId: 'uuid',
  senderId: 'uuid',
  encryptedContent: 'base64...',
  timestamp: 1234567890
}
```

**Fallback (Offline):**
- Messages queued locally
- Sent when connection restored
- Conflict resolution: timestamp-based ordering

---

### Web App (PWA)

**Tech Stack:**
- **Framework:** React 18 + Vite
- **UI Library:** Tailwind CSS + Radix UI
- **State:** Zustand or Jotai
- **Database:** IndexedDB (local storage)
- **Encryption:** WebCrypto API (browser-native)

**Architecture:**
- Same WebSocket server as native apps
- Same E2E encryption (libsignal compiled to WASM)
- Offline support (PWA Service Worker)

---

## Stage 3 Architecture (Full Messenger)

### Voice/Video Calls

**Tech:** WebRTC (peer-to-peer)

**Signaling Server:**
- Exchange SDP offers (connection info)
- STUN/TURN servers for NAT traversal

**Flow:**
1. User A calls User B → sends SDP offer via server
2. User B receives offer → sends SDP answer
3. Peer-to-peer connection established (bypasses server)
4. Media streams (encrypted via DTLS-SRTP)

**TURN Server (Fallback):**
- When P2P fails (strict firewalls)
- Self-hosted (coturn) or Twilio

---

### Media Storage

**Architecture:**
- **Storage:** AWS S3 or Cloudflare R2
- **CDN:** CloudFront or Cloudflare CDN
- **Encryption:** Client-side (encrypt before upload)

**Flow:**
1. User uploads photo
2. Client encrypts photo (AES-256)
3. Upload to S3 (encrypted blob)
4. URL stored in message metadata
5. Recipients download + decrypt

**Costs:**
- S3: ~$0.023/GB/month
- Bandwidth: ~$0.09/GB
- For 1M users, ~10TB media = $230/month storage + $9k/month bandwidth

---

### Push Notifications

**Providers:**
- iOS: Apple Push Notification Service (APNs)
- Android: Firebase Cloud Messaging (FCM)
- Web: Web Push API

**Flow:**
1. User receives message while app closed
2. Server sends encrypted notification to APNs/FCM
3. OS delivers notification
4. User taps → app opens → decrypts message

**Privacy:**
- Notification payload is encrypted (server can't read)
- Notification shows: "New message from Alice" (no content)

---

### Scaling

**Horizontal Scaling:**
- **App Servers:** Load balancer → multiple Node.js instances
- **Database:** PostgreSQL read replicas, pgBouncer pooling
- **Redis:** Caching, rate limiting, message queue

**Database Sharding:**
- Shard by `user_id` or `space_id`
- Use Citus (PostgreSQL extension) or manual sharding

**Global CDN:**
- Cloudflare or Fastly
- Serve static assets (images, JS bundles)
- Reduce latency (edge caching)

**Cost Projections:**

| Users | Messages/Day | Storage | Server Costs | Bandwidth | Total/Month |
|-------|--------------|---------|--------------|-----------|-------------|
| 10k   | 100k         | 100GB   | $100         | $50       | $150        |
| 100k  | 1M           | 1TB     | $1k          | $500      | $1.5k       |
| 1M    | 10M          | 100TB   | $50k         | $10k      | $60k        |

**Revenue @ 1M users (15% paid):**
- 150k paying users × $19/month = $2.85M/month
- Server costs: $60k/month = 2% of revenue ✅

---

## Security Architecture

### Encryption Layers

1. **Transport (TLS 1.3):**
   - Client ↔ Server encrypted (prevents eavesdropping)

2. **End-to-End (Signal Protocol):**
   - User A ↔ User B encrypted (server can't read)

3. **Local (SQLCipher):**
   - SQLite database encrypted on disk

### Threat Model

**What we protect against:**
- ✅ Server compromise (can't read messages)
- ✅ Network interception (TLS)
- ✅ Device theft (local encryption + biometrics)
- ✅ Malicious employees (zero-knowledge)

**What we DON'T protect against:**
- ❌ Device malware (keyloggers, screen capture)
- ❌ Physical access + password (user responsibility)
- ❌ Compromised client app (code signing required)

### Authentication

**Stage 0–1 (Local-Only):**
- No authentication (local app only)
- Optional: device passcode or Face ID

**Stage 2–3 (Server):**
- **Phone Number Verification:** SMS code (Twilio)
- **JWT Tokens:** Short-lived (1 hour), refresh tokens (30 days)
- **2FA (Optional):** TOTP (Google Authenticator)

---

## Monitoring & Observability

### Metrics (Stage 2+)

**Server:**
- Request latency (p50, p95, p99)
- Error rate (5xx responses)
- WebSocket connections (active count)
- Database query time

**Client:**
- App crashes (via Sentry or Crashlytics)
- Message send success rate
- Agent invocation latency

**Tools:**
- **Metrics:** Prometheus + Grafana
- **Logs:** Loki or CloudWatch
- **Errors:** Sentry
- **APM:** DataDog or New Relic

---

### Logging (Privacy-First)

**What to log:**
- ✅ Request metadata (timestamp, user ID, endpoint)
- ✅ Error stack traces
- ✅ Performance metrics

**What NOT to log:**
- ❌ Message content
- ❌ User PII (email, phone)
- ❌ Encryption keys

**Log Retention:**
- 30 days max
- Auto-delete after retention period

---

## Development Workflow

### Local Development

**iOS/macOS:**
```bash
# Clone repo
git clone https://github.com/yourorg/app.git
cd app

# Install dependencies
brew install swiftlint grdb.swift

# Open in Xcode
open App.xcodeproj

# Run on simulator
xcodebuild -scheme App -destination 'platform=iOS Simulator,name=iPhone 15'
```

**Server (Stage 2+):**
```bash
# Clone repo
git clone https://github.com/yourorg/server.git
cd server

# Install dependencies
npm install

# Run PostgreSQL (Docker)
docker run -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres

# Start server
npm run dev
```

---

### CI/CD Pipeline

**GitHub Actions:**

```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: swift test

  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build iOS
        run: xcodebuild -scheme App -sdk iphoneos

  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to TestFlight
        run: fastlane beta
```

**Deployment:**
- **iOS/macOS:** Fastlane → TestFlight → App Store
- **Android:** Fastlane → Google Play (internal → beta → production)
- **Server:** Railway (auto-deploy on push to main)

---

## Open-Source Strategy

**What to open-source:**
- ✅ Encryption protocol (transparency)
- ✅ Server code (trust, self-hosting option)
- ✅ Agent SDKs (enable third-party agents)

**What to keep closed:**
- ❌ iOS/Android app (proprietary UI/UX)
- ❌ AI model fine-tuning (competitive advantage)

**Benefits:**
- Trust (security researchers can audit)
- Community contributions (bug fixes, agents)
- Self-hosting (enterprise customers)

**License:**
- **Server:** AGPL-3.0 (must open-source modifications)
- **SDKs:** MIT (permissive, encourage adoption)

---

## Disaster Recovery

### Backups

**Client:**
- Local: automatic to iCloud/Google Drive (encrypted)
- Manual: export to JSON (user-initiated)

**Server:**
- PostgreSQL: daily snapshots (AWS RDS automated backups)
- S3: versioning enabled (recover deleted files)

### Failover

**Database:**
- Multi-AZ deployment (AWS RDS)
- Automatic failover (<1 minute downtime)

**App Servers:**
- Multi-region (US, EU, Asia)
- Load balancer health checks
- Auto-restart unhealthy instances

---

**Next Action:** Review architecture with engineering team, validate technical choices

**Last Updated:** 2025-12-02
**Owner:** [TBD]
