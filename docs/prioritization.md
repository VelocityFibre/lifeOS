# Feature Prioritization Framework

**Last Updated:** 2025-12-02
**Purpose:** Ruthlessly prioritize features across all stages to maximize value and minimize scope creep

---

## Prioritization Methodology

### RICE Framework

We use **RICE scoring** to prioritize features:

**RICE = (Reach × Impact × Confidence) / Effort**

- **Reach:** How many users benefit? (per month)
- **Impact:** How much does it improve their experience? (0.25 = low, 0.5 = medium, 1 = high, 2 = massive)
- **Confidence:** How sure are we? (50% = low, 80% = medium, 100% = high)
- **Effort:** How many person-months to build?

**Example:**
- Feature: @mem (memory search)
- Reach: 1,000 users
- Impact: 2 (massive improvement)
- Confidence: 100%
- Effort: 1 month
- **RICE = (1000 × 2 × 1.0) / 1 = 2000**

Higher RICE = higher priority.

---

## Stage 0 Feature Prioritization

### Must-Have (Blocking Launch)

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| Chat UI | 1000 | 2.0 | 100% | 1.5 | 1333 | P0 |
| @mem (search) | 1000 | 2.0 | 100% | 1.0 | 2000 | P0 |
| @cal (calendar) | 1000 | 1.0 | 100% | 0.75 | 1333 | P0 |
| @mail (email) | 800 | 1.5 | 80% | 2.0 | 480 | P0 |
| Local encryption | 1000 | 1.0 | 100% | 1.0 | 1000 | P0 |
| CloudKit sync | 600 | 1.0 | 80% | 1.5 | 320 | P1 |

**Decision:** Build all P0 features first (5 months), defer CloudKit sync to post-launch.

---

### Nice-to-Have (Can Ship Without)

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| Weather tool | 400 | 0.25 | 100% | 0.25 | 400 | P2 |
| Calculator | 300 | 0.25 | 100% | 0.1 | 750 | P2 |
| Time zones | 200 | 0.25 | 100% | 0.1 | 500 | P2 |
| Voice notes | 500 | 0.5 | 80% | 0.5 | 400 | P2 |
| Dark mode | 1000 | 0.5 | 100% | 0.5 | 1000 | P1 |

**Decision:**
- Dark mode: Add before launch (high reach, low effort)
- Weather/calc/timezones: Ship in week 2 after launch (easy wins)
- Voice notes: Defer to Stage 1 (needs transcription API)

---

### Explicitly Out of Scope (Stage 0)

❌ Android app (wait for iOS PMF)
❌ Web app (desktop only)
❌ Multiplayer (Stage 2)
❌ Voice calls (Stage 3)
❌ Custom themes (never?)

---

## Stage 1 Feature Prioritization

### Agent Prioritization

| Agent | Reach | Impact | Confidence | Effort | RICE | WTP* | Priority |
|-------|-------|--------|------------|--------|------|------|----------|
| @travel | 5000 | 2.0 | 80% | 2.0 | 4000 | $39 | P0 |
| @finance | 4000 | 1.5 | 70% | 2.5 | 1680 | $39 | P0 |
| @tasks | 10000 | 1.0 | 90% | 1.5 | 6000 | $19 | P0 |
| @health | 6000 | 1.0 | 80% | 1.0 | 4800 | $39 | P1 |
| @spotify | 3000 | 0.5 | 60% | 1.0 | 900 | $0 | P2 |
| @github | 1000 | 0.5 | 70% | 0.75 | 467 | $0 | P3 |

*WTP = Willingness to Pay (which tier it unlocks)

**Decision:**
1. Build @tasks first (highest RICE, broad appeal)
2. Build @travel + @finance together (Pro tier unlocks)
3. Build @health after seeing @travel/@finance adoption
4. Defer @spotify/@github to Stage 2 (low impact)

---

### Platform Prioritization

| Platform | Reach | Impact | Confidence | Effort | RICE | Priority |
|----------|-------|--------|------------|--------|------|----------|
| Android | 8000 | 1.5 | 80% | 3.0 | 3200 | P0 |
| iPad (optimized) | 2000 | 0.5 | 90% | 0.5 | 1800 | P1 |
| Apple Watch | 1500 | 0.25 | 70% | 1.0 | 263 | P3 |
| Linux desktop | 500 | 0.5 | 60% | 2.0 | 75 | P4 |

**Decision:**
- Android: Start in Month 6, launch in Month 9 (critical for growth)
- iPad: Quick win (mostly free with SwiftUI)
- Apple Watch/Linux: Not worth it

---

## Stage 2 Feature Prioritization

### Core Features

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| Shared spaces | 50000 | 2.0 | 70% | 4.0 | 17500 | P0 |
| E2E encryption (multi) | 50000 | 1.5 | 60% | 3.0 | 15000 | P0 |
| Real-time sync (WS) | 50000 | 1.5 | 80% | 2.5 | 24000 | P0 |
| Web app (PWA) | 30000 | 1.0 | 70% | 3.0 | 7000 | P1 |
| Shared @tasks | 40000 | 1.0 | 90% | 1.0 | 36000 | P0 |
| Shared @travel | 20000 | 1.5 | 80% | 1.5 | 16000 | P0 |
| Shared @finance | 15000 | 1.5 | 70% | 2.0 | 7875 | P1 |

**Decision:**
- Build spaces + encryption + sync first (foundation)
- Build shared @tasks + @travel (highest RICE)
- Defer shared @finance (complex permissions)
- Web app: Start after spaces stabilize

---

### Space Features (Post-Launch)

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| Space templates | 30000 | 0.5 | 80% | 0.5 | 12000 | P1 |
| @ mentions | 40000 | 1.0 | 90% | 0.25 | 144000 | P0 |
| Role permissions | 20000 | 0.5 | 70% | 1.0 | 7000 | P2 |
| Space analytics | 5000 | 0.5 | 60% | 1.5 | 1000 | P3 |
| Guest access | 10000 | 0.5 | 50% | 1.0 | 2500 | P3 |

**Decision:**
- @mentions: Critical (highest RICE)
- Space templates: Easy win (pre-built configs)
- Permissions: Wait for Team tier demand
- Analytics: Only if Team customers ask

---

## Stage 3 Feature Prioritization

### Messaging Features

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| 1-on-1 chat | 200000 | 2.0 | 80% | 2.0 | 160000 | P0 |
| Group chats | 150000 | 1.5 | 80% | 1.5 | 120000 | P0 |
| Media sharing | 200000 | 1.5 | 90% | 2.0 | 135000 | P0 |
| Voice calls | 100000 | 1.5 | 70% | 3.0 | 35000 | P1 |
| Video calls | 80000 | 1.0 | 60% | 3.5 | 13714 | P1 |
| Stories/Status | 120000 | 0.5 | 50% | 2.0 | 15000 | P2 |
| Channels | 50000 | 1.0 | 60% | 2.5 | 12000 | P2 |
| Stickers/GIFs | 150000 | 0.25 | 80% | 0.5 | 60000 | P1 |

**Decision:**
1. 1-on-1 + group chats (foundation)
2. Media sharing (table stakes)
3. Voice calls (before video, lower effort)
4. Stickers/GIFs (high RICE, low effort)
5. Video calls (after voice)
6. Stories, channels: Wait for user demand

---

### Advanced Features

| Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|---------|-------|--------|------------|--------|------|----------|
| Agent marketplace | 50000 | 1.5 | 50% | 4.0 | 9375 | P2 |
| Self-destructing msgs | 80000 | 0.5 | 80% | 1.0 | 32000 | P1 |
| Screenshot detection | 60000 | 0.25 | 70% | 0.5 | 21000 | P2 |
| Chat export | 30000 | 0.5 | 90% | 0.5 | 27000 | P1 |
| Cloud backup | 100000 | 1.0 | 80% | 1.5 | 53333 | P0 |

**Decision:**
- Cloud backup: Critical (users expect it)
- Self-destructing messages: High demand (privacy)
- Chat export: Regulatory requirement (GDPR)
- Agent marketplace: Wait until PMF proven

---

## Cross-Stage Tool Prioritization

| Tool | Stage | Reach | Impact | Confidence | Effort | RICE | Priority |
|------|-------|-------|--------|------------|--------|------|----------|
| Web search | 1 | 10000 | 1.0 | 80% | 1.0 | 8000 | P0 |
| Image gen | 1 | 8000 | 0.5 | 70% | 0.5 | 5600 | P1 |
| Vision/OCR | 1 | 6000 | 1.0 | 80% | 1.0 | 4800 | P1 |
| PDF summary | 1 | 5000 | 1.0 | 90% | 0.5 | 9000 | P0 |
| Voice transcription | 1 | 7000 | 1.0 | 80% | 1.0 | 5600 | P1 |
| Code execution | 2 | 3000 | 1.5 | 60% | 2.0 | 1350 | P3 |

**Decision:**
- Stage 1: Web search + PDF summary (high RICE)
- Stage 1: Image gen, vision, voice (after agents stabilize)
- Stage 2: Code execution (niche, security risks)

---

## Anti-Prioritization (What NOT to Build)

### Features We Explicitly Reject

| Feature | Why Not? |
|---------|----------|
| **Public social network** | Scope creep, moderation nightmare |
| **Ads** | Ruins UX, conflicts with privacy |
| **Algorithmic feed** | Addictive, not aligned with productivity |
| **Cryptocurrency wallet** | Regulatory risk, security liability |
| **Dating features** | Different product, different market |
| **Games** | Distraction from core value prop |
| **NFT integration** | Gimmick, no user demand |
| **AI voice cloning** | Ethical concerns, misuse potential |

---

## Decision Framework (When in Doubt)

### Question Checklist

Before building any feature, ask:

1. **Does it advance the core vision?**
   - ✅ If yes: Consider
   - ❌ If no: Reject

2. **Will it increase retention?**
   - ✅ If yes: High priority
   - ❌ If no: Defer

3. **Will users pay for it?**
   - ✅ If yes: Monetizable
   - ❌ If no: Needs strong retention/growth impact

4. **Can we build it in <1 month?**
   - ✅ If yes: Quick win
   - ❌ If no: Break into smaller pieces

5. **Is it a competitive necessity?**
   - ✅ If yes: Must-have
   - ❌ If no: Nice-to-have

6. **Does it compromise privacy?**
   - ✅ If yes: Reject (non-negotiable)
   - ❌ If no: Proceed

---

## User-Driven Prioritization

### How to Listen to Users

**What to trust:**
- ✅ Usage data (what they do)
- ✅ Churn reasons (exit surveys)
- ✅ Feature requests from 10+ users
- ✅ Support tickets (pain points)

**What to ignore:**
- ❌ Feature requests from 1-2 users (outliers)
- ❌ "It would be cool if..." (without use case)
- ❌ Requests that conflict with vision
- ❌ Competitor feature parity ("Slack has X")

**Process:**
1. Collect feedback (Discord, surveys, support)
2. Categorize (bugs, features, improvements)
3. Score with RICE
4. Review quarterly (re-prioritize)

---

## Quarterly Review Process

### Every 3 Months

1. **Review completed features:**
   - Did they hit expected RICE?
   - What was actual effort vs. estimate?
   - Adjust future estimates

2. **Re-score pending features:**
   - Update reach (user base changed)
   - Update confidence (new data)
   - Reorder roadmap

3. **Kill low-performers:**
   - Features with RICE <500: consider dropping
   - Features with <10% adoption: deprecate
   - Features with negative NPS: remove

4. **Add new features:**
   - User requests (top 5)
   - Competitive gaps
   - Market opportunities

---

## Example: Stage 0 Build Order

**Month 1:**
1. Chat UI (basic, no bells/whistles)
2. Message storage (SQLite, encrypted)
3. @mem agent (keyword search only, no RAG yet)

**Month 2:**
4. @cal agent (basic event CRUD)
5. @mail agent (Gmail OAuth + read emails)
6. Dark mode (user setting)

**Month 3:**
7. @mem RAG (embeddings + semantic search)
8. @mail drafting (LLM-powered)
9. CloudKit sync (beta)

**Month 4:**
10. Polish UI (animations, haptics)
11. TestFlight launch (100 users)
12. Bug fixes, iteration

**Why this order?**
- Chat UI first (foundation)
- @mem early (wow moment)
- @cal/@mail in parallel (independent)
- RAG later (nice-to-have, complex)

---

## Trade-Off Decisions

### Common Dilemmas

**Dilemma 1: Depth vs. Breadth**
- **Breadth:** Many basic agents (10 agents, 50% complete)
- **Depth:** Few polished agents (3 agents, 95% complete)
- **Decision:** Depth (better to have 3 great agents than 10 mediocre)

**Dilemma 2: iOS vs. Android**
- **iOS First:** Faster dev, better monetization
- **Android First:** Larger market, more users
- **Decision:** iOS first (Stage 0), Android in Stage 1 (proven PMF)

**Dilemma 3: Privacy vs. Features**
- **Privacy:** Strict E2E, no server access
- **Features:** Server-side AI (better, faster)
- **Decision:** Privacy always wins (non-negotiable)

**Dilemma 4: Free vs. Paid**
- **Free:** Faster growth, network effects
- **Paid:** Revenue, focus on quality
- **Decision:** Paid-only (Stage 0–1), free tier in Stage 3 (after scale)

---

## Kill Criteria

### When to Kill a Feature

A feature should be **removed** if:

1. **<10% adoption after 3 months**
   - Example: If @spotify only used by 5% of users, consider removing

2. **Negative NPS impact**
   - Example: Users complain feature is confusing, buggy, or slow

3. **High maintenance cost**
   - Example: Feature requires weekly fixes, disproportionate to value

4. **Security risk**
   - Example: Feature creates privacy/security vulnerability

5. **Better alternative exists**
   - Example: Native iOS feature now does what our custom feature did

**Process:**
1. Deprecate (announce removal, give 30 days notice)
2. Migrate users (suggest alternative)
3. Remove code (clean up, reduce complexity)

---

## Roadmap Summary (Next 18 Months)

| Month | Focus | Key Features |
|-------|-------|--------------|
| 1–3 | Stage 0 MVP | Chat, @mem, @cal, @mail |
| 4 | Launch | TestFlight beta (100 users) |
| 5–6 | Iterate | Polish, fix bugs, hit PMF |
| 7–9 | Stage 1 | @travel, @finance, @tasks, Android |
| 10–12 | Stage 2 Alpha | Shared spaces (beta) |
| 13 | Stage 2 Launch | Public shared spaces |
| 14–18 | Stage 2 Growth | Web app, viral loops, Team tier |

**Stage 3:** Only start if Stage 2 hits 100k users by Month 18.

---

**Next Action:** Use this framework to finalize Stage 0 scope (next 30 days)

**Last Updated:** 2025-12-02
**Owner:** [TBD]
