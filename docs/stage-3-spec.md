# Stage 3 Specification: Full Messenger

**Timeline:** Month 19+ (Year 2–3)
**Target Users:** 200,000 → 1,000,000+
**Revenue Goal:** $10M+ ARR
**Depends On:** Stage 2 achieving 100k users, strong retention, proven viral loops

---

## What We're Building

Transform from "personal OS with shared spaces" to a **full-featured, encrypted messenger**—a true WhatsApp/Signal replacement, but with AI agents, tools, and productivity features baked in.

**This is the endgame.**

## Success Criteria

- 1M+ active users
- 50+ messages sent per user per day
- Network effect: viral coefficient >1.2
- $10M+ ARR
- Position as the #1 private, AI-powered messenger

---

## Core Features

### 1. Person-to-Person Chat

**What it is:**
Direct 1-on-1 messaging with anyone, not just people in shared spaces.

**How It Works:**
1. User taps "New Chat" → enters phone number or username
2. If recipient has app → chat opens
3. If not → send invite link (SMS/email)
4. Messages are E2E encrypted

**Contact Discovery:**
- Sync phone contacts (opt-in, privacy-first)
- Username search: "@alice" or "alice@domain.com"
- QR code: scan to add contact (in-person)

**User Flow:**
1. Open app → see chat list (Personal, Spaces, Contacts)
2. Tap contact → start chatting
3. Send text, images, voice notes, files
4. All standard messenger features (reactions, replies, forwarding)

---

### 2. Group Chats (vs Shared Spaces)

**What's the difference?**

| **Shared Spaces** (Stage 2) | **Group Chats** (Stage 3) |
|---------------------------|--------------------------|
| Project/purpose-based | Casual, social |
| Shared agents (tasks, calendar) | Just messaging (+ optional agents) |
| 10–50 members | 2–256 members |
| Formal (team, family trip) | Informal (friend group, book club) |

**Group Chat Features:**
- Create group → add members
- Group name + avatar
- Admin controls (who can send, who can invite)
- @mentions
- Mute notifications

---

### 3. Media Sharing

**What it includes:**
- Photos & videos (compressed + original quality toggle)
- Voice messages (tap & hold to record)
- Files (PDFs, docs, up to 100MB per file)
- Location sharing (Google Maps link)
- Contacts (vCard format)

**Media Gallery:**
- See all media from a chat (grid view)
- Swipe through photos/videos
- Auto-download on Wi-Fi (user setting)

---

### 4. Calls (Voice & Video)

**What it is:**
End-to-end encrypted voice and video calls, integrated into chat.

**How It Works:**
- Tap call icon → ring recipient
- Accept → call starts (E2E encrypted via WebRTC)
- Group calls: up to 8 people

**Technical:**
- WebRTC for peer-to-peer calls
- TURN server for NAT traversal (self-hosted or Twilio)
- Encryption: DTLS-SRTP

**Quality:**
- HD video (720p)
- Low latency (<150ms)
- Auto-adjust quality based on bandwidth

---

### 5. Status Updates (Stories)

**What it is:**
WhatsApp-style status updates (photos/videos that disappear after 24 hours).

**How It Works:**
- User posts status (photo, video, text)
- Visible to all contacts (or selected)
- Disappears after 24 hours
- Can reply to status (opens 1-on-1 chat)

**Privacy:**
- Control who sees status (all contacts, favorites, exclude list)
- See who viewed your status

**Agent Integration:**
- AI-generated status ideas: "Share your day's stats" (steps, mood)
- Auto-post: "Daily reflection" at 9pm (if enabled)

---

### 6. Channels (Broadcast Mode)

**What it is:**
One-to-many broadcasting (like Telegram channels). Creator posts updates, followers read (no replies in channel).

**Use Cases:**
- Newsletter creators
- Community updates
- Product announcements

**Features:**
- Unlimited followers
- Rich media (text, images, links)
- Analytics (views, clicks)

**Monetization:**
- Free: up to 1,000 followers
- Pro: unlimited followers + analytics

---

### 7. Advanced Privacy Features

**Disappearing Messages:**
- Set timer: 24 hours, 7 days, 90 days
- Messages auto-delete after timer
- Applies to all messages in chat (both sides)

**Screenshot Detection:**
- Notify sender if recipient screenshots (iOS/Android)

**Incognito Mode:**
- Disable read receipts
- Disable "typing..." indicator
- Disable last seen

**Blocked Contacts:**
- Block user → no messages, calls, or status views

---

### 8. Chat Export & Backup

**Export Chat:**
- Export entire chat history (JSON, PDF, HTML)
- Includes media (ZIP file)
- Useful for legal, archival purposes

**Cloud Backup:**
- iCloud/Google Drive encrypted backup
- Restore on new device
- Optional: auto-backup daily

---

## Enhanced Agent Features

### Agents in 1-on-1 Chats

**Scenario:** You're chatting with a friend.
- You: "Hey, want to grab coffee tomorrow?"
- Friend: "Sure! What time?"
- You: `@cal find time tomorrow afternoon`
- Agent responds (only you see): "You're free 2-4pm"
- You: "How about 3pm at Blue Bottle?"

**Key:** Agents respond to you only, not the friend (unless friend also invokes).

---

### Shared Agent Invocation

**Scenario:** Planning trip with friends in group chat.
- You: `@travel plan trip to Bali, March 10-15`
- Agent: "I'll help everyone plan! Who's going?"
- Friend 1: "Me!"
- Friend 2: "Me too!"
- Agent creates shared trip (visible to all)

**Permission:** Group admin can enable/disable agents in group settings.

---

### Agent Marketplace (New)

**What it is:**
Third-party developers can build custom agents.

**Examples:**
- `@spotify` → control music, share playlists
- `@github` → get notifications, close issues
- `@stripe` → check payments, refunds
- `@notion` → search pages, create tasks

**Developer Tools:**
- SDK (TypeScript, Python)
- API access (OAuth)
- Revenue share (70/30 split, dev gets 70%)

**User Experience:**
- Browse marketplace (in-app)
- Install agent → appears in `@` menu
- Uninstall anytime

---

## Platform Expansion

### Desktop Apps

**Why Now?**
- Power users want native Mac/Windows apps
- Better than web for speed + notifications

**Platforms:**
- macOS (already have from Stage 0)
- Windows (Electron or native C#)
- Linux (Electron)

**Features:**
- Full feature parity with mobile
- Keyboard shortcuts
- Multi-window support (chat + calendar side-by-side)

---

### Browser Extension

**What it does:**
- Quick access from browser (Chrome, Firefox, Safari)
- Send links/text to chat (right-click → "Send to [App]")
- Notifications (even when app closed)

**Use Cases:**
- Save article to read later (send to Personal chat)
- Share link with friend (quick send)

---

## Monetization (Updated)

### Free Tier (NEW)
- 1-on-1 chats (unlimited)
- Group chats (up to 5 members)
- Basic agents (mem, cal)
- 1 shared space
- 1GB storage

**Goal:** Drive network effects (more free users = more paying users via invites)

---

### Individual - $9/month (REDUCED)
- All free features
- Unlimited group chats
- All core agents (mail, tasks)
- 5 shared spaces
- 10GB storage

---

### Plus - $19/month (REDUCED)
- All Individual features
- Premium agents (travel, finance, health)
- 20 shared spaces
- Voice/video calls (HD quality)
- 100GB storage
- Custom status (GIFs, polls)

---

### Team - $49/month
- All Plus features
- Unlimited shared spaces
- 100 members per space
- Admin analytics
- SSO (Single Sign-On for enterprises)
- Priority support

---

### Enterprise - Custom Pricing
- Self-hosted option (on-premises)
- Dedicated server
- Custom integrations
- SLA (99.9% uptime)
- White-label option

---

## User Acquisition Strategy

### Viral Loops

1. **Invite Incentives:**
   - Invite 5 friends → get 1 month free
   - Friend signs up → you both get bonus storage

2. **Network Lock-In:**
   - Once 5+ friends are on platform → hard to leave
   - Group chats = sticky

3. **Public Channels:**
   - Creators share channel links on Twitter/Instagram
   - Followers join → discover app

---

### Partnerships

1. **Influencers:**
   - Pay top YouTubers/podcasters to review
   - Affiliate program (10% revenue share)

2. **Communities:**
   - Sponsor Discord servers, Reddit communities
   - Offer free Team plan for moderators

3. **Enterprises:**
   - Target remote teams, startups
   - Offer migration support from Slack

---

### PR & Media

- Press releases: "The WhatsApp Killer"
- Tech publications: TechCrunch, The Verge, Wired
- Podcast circuit: Lex Fridman, Tim Ferriss
- Conference talks: TED, Web Summit

---

## Technical Requirements

### Scale

**Infrastructure:**
- 1M+ users = ~10M messages/day
- 100TB+ media storage
- Global CDN (Cloudflare, AWS CloudFront)

**Database:**
- PostgreSQL (sharded by user ID)
- Redis (message queue, caching)
- S3 (media storage)

**Cost Estimate:**
- $50k–100k/month server costs at 1M users
- ~1% of revenue (very healthy margins)

---

### Performance

**Targets:**
- Message send: <100ms
- Message receive (push): <500ms
- App launch: <1s
- Media upload: <5s for 10MB file

---

### Reliability

- 99.9% uptime (43 minutes downtime/month max)
- Multi-region deployment (US, EU, Asia)
- Auto-failover (if one region down, route to another)

---

## Success Metrics

### Growth
- Weekly active users (WAU): 60%+ of total users
- Messages sent per user per day: 50+
- Viral coefficient: 1.2+ (each user invites 1.2 people)

### Engagement
- Sessions per day: 8+
- Session length: 5+ minutes
- Agents invoked per day: 5+

### Retention
- Month 1: 85%+
- Month 3: 70%+
- Month 12: 60%+

### Revenue
- Free → paid conversion: 15%+
- Churn: <3% monthly
- ARR: $10M+ by Year 3

---

## Competitive Analysis

### vs WhatsApp
- **Advantage:** AI agents, productivity tools
- **Disadvantage:** Smaller network (initially)
- **Strategy:** Target power users first, then casual users

### vs Signal
- **Advantage:** Better UX, more features
- **Disadvantage:** Signal's reputation for privacy
- **Strategy:** Match privacy, exceed on features

### vs Telegram
- **Advantage:** Better encryption (E2E by default)
- **Disadvantage:** Telegram's large network
- **Strategy:** Emphasize privacy + AI

### vs Slack
- **Advantage:** Better for small teams (cheaper, simpler)
- **Disadvantage:** Slack's enterprise features
- **Strategy:** Target startups, remote teams under 50 people

---

## Risks & Mitigations

### Risk: Can't compete with Big Tech (Meta, Apple)
- **Mitigation:** Focus on privacy + AI (they can't pivot easily)
- **Fallback:** Sell to them (acquisition exit)

### Risk: Regulatory pressure on encryption
- **Mitigation:** Open-source protocol, hire legal team
- **Fallback:** Geo-restrict in countries with bans

### Risk: Scaling costs exceed revenue
- **Mitigation:** Optimize infrastructure, raise prices
- **Fallback:** Reduce free tier limits

---

## Open Questions

1. **Acquisition risk:** What if Meta/Apple copies us?
2. **Moderation:** How to handle abuse without breaking encryption?
3. **Monetization:** Should we do ads? (Answer: No, ruins UX)

---

## Exit Strategy

**If we reach $10M ARR with strong retention:**

**Option 1: IPO**
- File for public offering (NASDAQ)
- Valuation: $500M–$1B (50–100x revenue)

**Option 2: Acquisition**
- Targets: Meta, Apple, Google, Microsoft
- Valuation: $300M–$1B

**Option 3: Stay Independent**
- Raise Series B ($50M+)
- Scale to 10M users, $100M ARR
- Become next Signal/Telegram

---

**Next Action:** Do NOT start Stage 3 until Stage 2 is rock-solid. Validate shared spaces first.

**Last Updated:** 2025-12-02
**Owner:** [TBD]
