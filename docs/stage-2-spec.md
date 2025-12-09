# Stage 2 Specification: Shared Spaces

**Timeline:** Months 10–18 after Stage 0 launch
**Target Users:** 20,000 → 200,000
**Revenue Goal:** $1M+ MRR
**Depends On:** Stage 1 achieving 15k users, 70% retention, $200k MRR

---

## What We're Building

Introduce **limited multiplayer** via "Shared Spaces"—private workspaces where users can collaborate with specific people. This is NOT full P2P messaging yet. Think: project collaboration, family trip planning, small team coordination.

**Key Constraint:** You can only message people inside a shared space, not via direct 1-on-1 chats.

## Success Criteria

- 100,000 active users by Month 18
- 40% of users create at least 1 shared space
- 2+ shared spaces per active user
- 80% month-1 retention
- $1M+ MRR

---

## Core Features

### 1. Shared Spaces

**What it is:**
A private workspace (like a Slack channel or Notion page) where 2–10 people can chat and share agents.

**How It Works:**
1. User creates space: "Create space: Barcelona Trip"
2. Invites members (email or phone number)
3. Members join → everyone sees shared chat + agents
4. Space persists until archived/deleted

**Space Types:**
- **Personal Projects:** "Website Redesign," "Q4 Planning"
- **Family/Friends:** "Europe Trip," "Book Club"
- **Small Teams:** "Engineering Sync," "Marketing Campaign"

**User Flow:**
1. Tap "New Space" → enter name + invite emails
2. Send invites (SMS or email link)
3. Invitees download app (if new) → join space
4. Chat + agents work inside space

**Technical Notes:**
- Spaces stored locally + synced via server (can't use iCloud for multi-user)
- E2E encryption: each space has unique encryption key shared via Signal protocol
- Max 10 members per space (Stage 2 limit)

---

### 2. Shared Agents

**What it is:**
Agents that work for the entire space, not just one person.

**Examples:**

#### Shared @tasks
- "Add task: Book flights for everyone"
- All members see the task
- Anyone can check it off or reassign

#### Shared @travel
- "Add flight to Barcelona Trip space"
- Everyone in space sees itinerary
- Updates (gate changes) notify all members

#### Shared @finance
- Track group expenses: "Add expense: $50 dinner, split 4 ways"
- Auto-calculate who owes whom
- Settle up: "Mark John as paid"

#### Shared @cal
- "Find time when everyone is free next week"
- Propose meeting times → vote
- Add to everyone's calendar

#### Shared @notes (new agent!)
- Collaborative notes inside space
- Markdown editor
- Real-time sync (CRDT-based)

**Agent Permissions:**
- Default: All members can invoke all agents
- Admin can restrict (e.g., only admin can invite to @finance)

---

### 3. Space Roles & Permissions

**Roles:**
1. **Admin:** Created space, can invite/remove members, delete space
2. **Member:** Can chat, use agents, invite others (if enabled)
3. **Guest:** Read-only (optional for future)

**Permissions (Admin-Controlled):**
- Who can invite new members
- Who can use specific agents (e.g., @finance)
- Who can delete messages

---

### 4. Invitations & Onboarding

**Invite Flow:**
1. Admin taps "Invite" → enters email or phone
2. Invitee receives link (SMS or email)
3. Clicks link → downloads app (if new) → joins space
4. If existing user: space appears in sidebar

**New User Onboarding (via Invite):**
1. Click invite link → app download page
2. Install → open app → auto-joins space (no account setup)
3. Sees shared space chat immediately
4. Can create personal space anytime

**Viral Loop:**
- Every new space = potential new users
- Target: 1.5 invites per user (viral coefficient = 1.5)

---

### 5. Space Management

**Space Sidebar (New UI):**
- Left sidebar shows:
  - "Personal" (your solo chat)
  - "Spaces" (list of shared spaces)
- Tap space → switch to that space's chat
- Unread indicators for spaces

**Space Settings:**
- Rename space
- Add/remove members
- Archive space (hides but keeps data)
- Delete space (permanent, admin only)
- Leave space (members can exit)

---

### 6. Notifications

**Push Notifications:**
- New message in space (if not active)
- @mentions: "Hey @john, can you book the hotel?"
- Agent updates: "Flight AA123 delayed 30 minutes"

**Notification Settings:**
- Mute space (disable notifications)
- Custom: notify only for @mentions
- DND mode (global off, user-level)

---

### 7. Message Sync & Conflict Resolution

**Challenge:**
Multiple users editing/sending messages simultaneously.

**Solution:**
- **CRDTs (Conflict-free Replicated Data Types)** for messages
- Last-write-wins for simple edits
- Operational transforms for collaborative notes

**Technical Implementation:**
- Sync server (AWS/GCP, minimal)
- WebSocket for real-time updates
- Local SQLite + server PostgreSQL
- E2E encryption: decrypt locally after fetch

---

## Updated Pricing

### Individual - $19/month
- Solo chat + core agents
- Up to 2 shared spaces
- 5 members per space

### Plus - $39/month
- All Individual features
- Premium agents (travel, finance, health)
- Up to 10 shared spaces
- 10 members per space

### Team - $99/month (NEW)
- All Plus features
- Unlimited shared spaces
- 50 members per space
- Admin controls (permissions, analytics)
- Priority support + onboarding

---

## Platform Updates

### Web App (New)
- Lightweight web client (React + Vite)
- Full chat + agents (parity with native apps)
- Works on Chromebooks, Linux, older devices
- URL: app.[domain].com

**Why Now?**
- Shared spaces → users want access on any device
- Lower barrier for invitees ("click link, no install needed")

**Technical:**
- PWA (Progressive Web App) for offline mode
- WebRTC for real-time sync
- End-to-end encryption in browser (WebCrypto API)

---

## User Flows

### Family Trip Planning

**Mom creates space:**
1. "Create space: Hawaii Vacation"
2. Invites Dad, kids via email
3. Everyone joins

**Collaboration:**
- Mom: "Add flight UA456 to space"
- Dad: "Find hotel near beach"
- Kid: "Create packing list"
- Everyone: Votes on activities

**Shared @travel agent:**
- Syncs all bookings
- Sends reminders to everyone

---

### Startup Team Coordination

**Founder creates space:**
1. "Create space: Product Launch"
2. Invites co-founder, designer, dev

**Daily Sync:**
- "Add task: Finish landing page, assign @designer"
- "What's on everyone's calendar this week?" → @cal
- "Show Q4 revenue" → @finance (shared Stripe account)

**Shared @tasks + @cal:**
- Everyone sees tasks + deadlines
- Calendar shows team availability

---

## Technical Requirements

### Server Infrastructure (New)

**Why a server now?**
- Multi-user sync requires central coordination
- Can't rely on iCloud for shared spaces

**Architecture:**
- **Sync Server:** PostgreSQL + WebSockets (AWS or Railway)
- **Storage:** Encrypted messages (server can't decrypt)
- **APIs:** REST for message fetch, WebSocket for real-time

**Costs:**
- $500–2k/month server costs at 100k users
- ~$20k/month at 200k users (still cheap, <2% of revenue)

**Privacy:**
- Zero-knowledge: server stores encrypted blobs
- Encryption keys stored on devices, shared via Signal protocol
- Open-source server code (build trust)

---

### E2E Encryption (Multi-User)

**Protocol:**
- **Signal Protocol** (used by WhatsApp, Signal)
- Each space has unique encryption key
- Keys exchanged via double-ratchet algorithm

**Key Management:**
- User device generates key pair
- Public key uploaded to server
- Private key never leaves device
- Space keys derived from member keys

---

## Success Metrics

### Adoption
- % of users who create 1+ space: 40%+
- % of invited users who join: 60%+
- Average spaces per user: 2+

### Engagement
- Messages sent in shared spaces vs solo: 50/50 split
- % of users active in spaces daily: 70%+

### Viral Growth
- Viral coefficient (invites sent / new users): 1.5+
- Invite → signup conversion: 50%+

### Retention
- Month 1: 80%+
- Month 3: 65%+
- Month 6: 55%+

---

## Launch Plan

### Beta Launch (Month 10–12)
1. Invite 1,000 existing users to beta
2. Test shared spaces with small groups (2-5 people)
3. Iterate based on feedback (weekly releases)

### Public Launch (Month 13)
1. Enable shared spaces for all users
2. Launch Team tier ($99/month)
3. Marketing push:
   - "Replace Slack for small teams"
   - "Your family's operating system"

### Growth Tactics (Month 14–18)
- Referral bonuses: "Invite 3 friends, get 1 month free"
- Template spaces: "Trip Planning," "Book Club," "Startup Team"
- Influencer partnerships (Nomad List, Indie Hackers)

---

## Risks & Mitigations

### Risk: Server Costs Explode
- **Mitigation:** Charge more for Team tier, monitor usage
- **Fallback:** Throttle free tier (1 space max)

### Risk: Encryption Complexity → Bugs
- **Mitigation:** Extensive security audit, open-source code
- **Fallback:** Hire security expert (contract basis)

### Risk: Users Don't Invite Others
- **Mitigation:** Make invites frictionless (SMS, email, link)
- **Fallback:** Offer incentives (free month for 5 invites)

### Risk: Spaces Feel Empty (Low Activity)
- **Mitigation:** Prompt users to add first task/event
- **Fallback:** AI agent suggests ice-breaker prompts

---

## Open Questions

1. **Moderation:** What if users spam spaces? (Kick feature, report abuse?)
2. **Data Export:** Can users export shared space data? (Privacy concerns)
3. **Analytics:** Should admins see member activity stats? (Creepy or useful?)

---

**Next Action:** Design space UI mockups, build sync server prototype (Month 10)

**Last Updated:** 2025-12-02
**Owner:** [TBD]
