# Stage 0 Specification: Solo Mode MVP

**Timeline:** 3–4 months
**Target Users:** 0 → 1,000 paying beta users
**Revenue Goal:** $10k MRR
**Status:** Ready to Build

---

## What We're Building

A single-user, local-first chat application where users converse with themselves and AI agents. This is a **personal OS wedge product**—not a messenger. No multiplayer, no sharing, no social features.

## Success Criteria

### Launch Readiness
- [ ] iOS app approved on TestFlight
- [ ] macOS app builds and syncs with iOS
- [ ] All 3 core agents functional (mem, cal, mail)
- [ ] E2E encryption working
- [ ] Stripe integration for subscriptions

### Product-Market Fit Signals
- 500 paying users within 3 months
- 60%+ week-1 retention
- 15+ minutes daily active usage
- NPS score >40

---

## Core Features (Must-Have)

### 1. Chat Interface

**What it does:**
A beautiful, WhatsApp-style chat UI where users message themselves. Messages are saved forever and auto-indexed for search.

**Key Requirements:**
- iOS + macOS native apps (SwiftUI)
- Single "Personal" chat thread (no channels yet)
- Rich text support (bold, italic, lists)
- Image/file attachments (photos, PDFs, voice notes)
- Message timestamps
- Infinite scroll (virtualized list for performance)
- Dark mode + light mode

**UX Flows:**
1. Open app → land directly in chat (no onboarding screens)
2. Type message → send → message saved locally + indexed
3. Scroll up → load older messages (lazy loading)
4. Long-press message → copy/delete options

**Technical Notes:**
- SQLite for message storage
- Full-text search index on message content
- CloudKit or iCloud sync (optional, user-enabled)

---

### 2. Agent System (@commands)

**What it does:**
Users type `@mem`, `@cal`, or `@mail` to invoke specialized agents. Agents respond inline in the chat.

**Agent Invocation:**
- Type `@` → autocomplete dropdown appears
- Select agent → agent "joins" the conversation
- Agent responds with natural language + structured data (cards, buttons)

**Technical Architecture:**
- Local LLM (Llama 3.2 or similar) for basic queries
- Cloud LLM (GPT-4 or Claude) for complex tasks
- Function/tool calling for agent actions (API calls, database queries)
- Streaming responses for real-time feel

---

### 3. Agent: @mem (Memory & Search)

**What it does:**
Full-text search across all messages, attachments, and metadata. Uses RAG (Retrieval-Augmented Generation) to answer questions about past conversations.

**User Queries:**
- "What did I say about the Berlin trip?"
- "Find my notes about the Q3 budget"
- "Show me all messages with images from last month"

**Technical Implementation:**
- Vector embeddings for semantic search (local embeddings model)
- SQLite FTS5 for keyword search
- Hybrid search: combine keyword + semantic results
- Re-rank with LLM for best results

**Response Format:**
- Text summary of findings
- Inline message previews (tap to jump to original)
- "Show more" button for additional results

---

### 4. Agent: @cal (Calendar)

**What it does:**
Create, view, and manage calendar events using natural language. Integrates with native iOS/macOS calendars (EventKit).

**User Queries:**
- "Add meeting with Sarah on Thursday at 3pm"
- "What's on my calendar tomorrow?"
- "Move my dentist appointment to next week"
- "Block focus time every morning 9-11am"

**Technical Implementation:**
- EventKit integration (iOS/macOS)
- LLM parses intent → creates structured event data
- Time zone awareness (use device timezone)
- Natural language date parsing (Thursday, next Monday, etc.)

**Response Format:**
- Confirmation message: "Added: Meeting with Sarah, Thu Dec 5, 3pm"
- Inline calendar card (shows event details, edit/delete buttons)
- List view for "what's on my calendar" queries

**Edge Cases:**
- Recurring events: "Every Monday at 9am"
- All-day events: "Mark Dec 25 as Christmas"
- Event reminders: "Remind me 30 min before"

---

### 5. Agent: @mail (Email)

**What it does:**
Connect Gmail or Outlook, then read, search, draft, and send emails directly from chat. Eliminates need for external email apps.

**User Queries:**
- "Show unread emails"
- "Search emails from John about the contract"
- "Reply to the last email: I'll send it by EOD"
- "Draft email to sarah@example.com: Hey Sarah, can we meet Friday?"

**Technical Implementation:**
- OAuth 2.0 for Gmail/Outlook
- IMAP/SMTP fallback for other providers
- Local email cache (last 90 days)
- LLM drafts emails based on user intent

**Response Format:**
- Email summary cards (sender, subject, preview, timestamp)
- Tap to expand full email
- Quick reply buttons ("Reply", "Archive", "Mark as read")
- Draft preview before sending

**Security:**
- OAuth tokens stored in Keychain (encrypted)
- No server access to email content
- User can revoke access anytime

---

### 6. Basic Tools

These are simple utility functions accessible via natural language (no `@` prefix needed).

**Weather:**
- "What's the weather in Lisbon?"
- "Will it rain tomorrow?"
- Integration: Apple Weather API or OpenWeather

**Time Zones:**
- "What time is it in Tokyo?"
- "Convert 3pm PST to CET"

**Quick Calc:**
- "What's 15% of 240?"
- "Convert 50 USD to EUR"
- Local calculation (no API needed)

**Unit Conversion:**
- "Convert 10 miles to km"
- "How many cups in 2 liters?"

**Technical Notes:**
- LLM detects tool intent and invokes local functions
- No `@` needed—just conversational queries
- Instant responses (no streaming needed)

---

### 7. Local-First + Encryption

**What it does:**
All data lives on the user's device. Optional iCloud sync for backups. End-to-end encryption ensures zero server access to content.

**Architecture:**
- **Local Storage:** SQLite database (encrypted with user's device key)
- **Sync:** iCloud CloudKit (encrypted end-to-end)
- **Backups:** User can export/import database

**Encryption Flow:**
1. User creates account (local only, no server registration)
2. Device generates encryption key (stored in Keychain)
3. All messages encrypted before saving to SQLite
4. Sync: encrypted data uploaded to iCloud (server cannot decrypt)

**User Controls:**
- Toggle sync on/off
- Export data (plaintext JSON)
- Delete all data locally

---

## Features Explicitly Out of Scope (Stage 0)

❌ Multiplayer (no inviting friends)
❌ Group chats
❌ Voice/video calls
❌ Desktop web app (only native iOS/macOS)
❌ Android (comes in Stage 1)
❌ Public API
❌ Third-party integrations (beyond Gmail/Outlook)
❌ Custom themes
❌ Browser extensions

---

## User Flows

### First-Time User (Onboarding)

1. Download app from TestFlight
2. Open app → see empty chat with welcome message:
   > "Welcome to [App Name]. This is your personal space. Try asking @mem, @cal, or @mail for help."
3. User types first message → instant save + confirmation
4. User types `@` → sees agent list
5. User selects `@mem` → agent explains itself

**No multi-step signup.** Just open and start chatting.

---

### Daily Use: Power User Flow

1. Morning: "What's on my calendar today?" → @cal responds
2. Commute: "Show unread emails" → @mail lists 5 emails
3. Reply to email: "Reply to John: Sounds good, let's sync Friday"
4. Lunch: "What did I say about the marketing plan last week?" → @mem searches
5. Evening: "Remind me to call Mom tomorrow at 5pm" → @cal creates event

**Key:** User never leaves the chat. Everything happens inline.

---

## Technical Requirements

### Platforms
- iOS 17+ (Swift, SwiftUI)
- macOS 14+ (Swift, SwiftUI)
- Shared codebase (90%+ code reuse)

### Backend
- **None initially** (fully local)
- Optional: Minimal cloud function for LLM fallback (OpenAI/Anthropic API)

### Data Storage
- SQLite (encrypted with SQLCipher)
- CloudKit for sync (opt-in)
- Keychain for secrets (OAuth tokens, keys)

### AI Models
- **Local:** Llama 3.2 1B (on-device inference)
- **Cloud:** GPT-4o-mini or Claude 3.5 Sonnet (for complex queries)
- **Embeddings:** Sentence-Transformers (local, for RAG)

### APIs/Integrations
- Gmail API (OAuth)
- Microsoft Graph API (Outlook)
- Apple EventKit (calendar)
- Apple WeatherKit

---

## Design Requirements

### Visual Style
- Clean, minimal, WhatsApp-inspired
- Large, readable fonts
- Generous whitespace
- System fonts (San Francisco on iOS/macOS)

### Colors
- Light mode: white background, dark text
- Dark mode: true black background (OLED-friendly)
- Accent color: TBD (based on brand)

### Agent Response Cards
- Distinct visual style (subtle background color)
- Icons for each agent (@mem = brain, @cal = calendar, @mail = envelope)
- Buttons for quick actions (Reply, Delete, Edit)

---

## Monetization (Stage 0)

### Pricing
- **Free Trial:** 14 days (full access)
- **Solo Plan:** $19/month (all features)

### Payment Integration
- Stripe for subscriptions
- Apple Pay preferred
- Cancel anytime (no refunds for current month)

### Trial Experience
- No credit card required for trial
- Email reminder on Day 10 (trial ending soon)
- Graceful degradation after trial (read-only mode)

---

## Success Metrics (Detailed)

### Activation
- % of users who send 10+ messages in first session
- % of users who invoke at least 1 agent in first session

### Retention
- Day 1 retention: 80%+
- Week 1 retention: 60%+
- Month 1 retention: 40%+

### Engagement
- Daily active users (DAU)
- Average messages sent per day per user (target: 20+)
- Average agents invoked per day per user (target: 3+)

### Revenue
- Trial → paid conversion rate (target: 25%+)
- Churn rate (target: <5% monthly)
- MRR by Month 3 (target: $10k)

---

## Launch Plan

### Beta Launch (Month 1–2)
- 100 handpicked users (Discord, Twitter DMs)
- Daily feedback sessions (Zoom calls)
- Rapid iteration (ship fixes within 24 hours)

### Closed Beta (Month 2–3)
- Expand to 500 users (TestFlight public link)
- Launch Discord community
- Weekly release notes

### Paid Launch (Month 3)
- Enable Stripe payments
- Product Hunt launch
- Press outreach (tech blogs)

---

## Open Questions

1. **Name:** Echo or Lark? (Decision needed before beta)
2. **Pricing:** $19/month or $15/month? (A/B test in beta)
3. **Free Tier:** Should there be one, or paid-only? (Recommend paid-only for Stage 0)
4. **Android:** When to start? (Recommend after Stage 0 PMF)

---

**Next Action:** Build iOS prototype with chat UI + @mem agent (2 weeks)

**Last Updated:** 2025-12-02
**Owner:** [TBD]
